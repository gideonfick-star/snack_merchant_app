// November 2026 clearance. Isolated from ordinary /orders checkout.
// This is a staged module: checkout remains OFF until payment lifecycle integration.
module.exports = function registerClearanceRoutes(app, pool) {
  const promotionCode = 'NOV2026-30';
  // Checkout stays disabled until payment verification is tested end-to-end.
  const enabled = () => process.env.CLEARANCE_CHECKOUT_ENABLED === 'true' && process.env.CLEARANCE_PAYMENT_INTEGRATION_VERIFIED === 'true';
  const money = n => Math.round(Number(n) * 100);
  const reservationMinutes = method => method === 'PayFast' ? 30 : 1440;
  const error = (message, status = 400) => Object.assign(new Error(message), { status });

  app.get('/clearance-products', async (req, res) => {
    // Local development preview only. Never expose inactive products in production.
    const remoteIp = req.socket.remoteAddress || '';
    const loopback = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';
    const localPreview = process.env.NODE_ENV !== 'production' &&
      loopback && ['localhost', '127.0.0.1'].includes(req.hostname);

    try {
      const { rows } = await pool.query(`
        SELECT id, product_name, pack_size, retail_price, promotional_price,
               available_quantity, best_before
        FROM public.clearance_products
        WHERE promotion_code = $1 AND (active = TRUE OR $2::boolean = TRUE)
        ORDER BY id`, [promotionCode, localPreview]);
      res.json({ success: true, promotionCode, preview: localPreview, products: rows.map(row => ({
        ...row,
        retail_price: Number(row.retail_price),
        promotional_price: Number(row.promotional_price)
      })) });
    } catch (err) {
      console.error('CLEARANCE CATALOGUE ERROR:', err);
      res.status(500).json({ success: false, error: 'Unable to load clearance products' });
    }
  });

  // Call only from a trusted, authenticated workflow after payment verification.
  // Both order and reservation rows are locked so repeated notifications cannot
  // double-confirm or double-release a reservation.
  async function transitionReservation(orderId, action, client) {
    const orderResult = await client.query(
      'SELECT id, payment_status, order_status FROM public.orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );
    if (!orderResult.rows.length) throw error('Order not found.', 404);
    const order = orderResult.rows[0];
    const { rows } = await client.query(`
      SELECT id, clearance_product_id, quantity, status
      FROM public.clearance_reservations WHERE order_id = $1
      ORDER BY clearance_product_id FOR UPDATE`, [orderId]);
    if (!rows.length) throw error('No clearance reservations for this order.', 404);
    const statuses = new Set(rows.map(r => r.status));
    if (action === 'CONFIRMED') {
      if (statuses.has('RELEASED') || statuses.has('EXPIRED')) {
        throw error('Reservation already released. Manual stock reconciliation required.', 409);
      }
      if (statuses.size === 1 && statuses.has('CONFIRMED')) return { changed: false, order };
      // An unswept reservation can already be past its deadline. Never
      // automatically mark such a payment as fulfilled: review it manually.
      // This check runs while holding the order and reservation row locks.
      const overdue = await client.query(`
        SELECT COUNT(*)::int AS count FROM public.clearance_reservations
        WHERE order_id = $1 AND status = 'RESERVED'
          AND (expires_at IS NULL OR expires_at <= clock_timestamp())`, [orderId]);
      if (overdue.rows[0].count > 0) {
        throw error('Reservation deadline passed. Manual payment and stock reconciliation required.', 409);
      }
      await client.query(`UPDATE public.clearance_reservations
        SET status = 'CONFIRMED' WHERE order_id = $1 AND status = 'RESERVED'`, [orderId]);
      await client.query(`UPDATE public.orders SET payment_status = 'Paid',
        order_status = 'Paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [orderId]);
      return { changed: true, order };
    }
    if (action === 'RELEASED') {
      if (order.payment_status === 'Paid' || statuses.has('CONFIRMED')) {
        throw error('Paid or confirmed stock cannot be released automatically.', 409);
      }
      if (statuses.size === 1 && statuses.has('RELEASED')) return { changed: false, order };
      for (const row of rows) {
        if (row.status !== 'RESERVED') continue;
        await client.query(`UPDATE public.clearance_products
          SET available_quantity = available_quantity + $1
          WHERE id = $2`, [row.quantity, row.clearance_product_id]);
      }
      await client.query(`UPDATE public.clearance_reservations
        SET status = 'RELEASED' WHERE order_id = $1 AND status = 'RESERVED'`, [orderId]);
      await client.query(`UPDATE public.orders SET order_status = 'Cancelled',
        payment_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [orderId]);
      return { changed: true, order };
    }
    if (action === 'EXPIRED') {
      if (order.payment_status === 'Paid' || statuses.has('CONFIRMED')) return { changed: false, order };
      const expired = rows.filter(r => r.status === 'RESERVED');
      if (!expired.length) return { changed: false, order };
      // Recheck the database clock after locking the order and reservation rows.
      const due = await client.query(`SELECT COUNT(*)::int AS due
        FROM public.clearance_reservations
        WHERE order_id = $1 AND status = 'RESERVED'
          AND expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP`, [orderId]);
      if (due.rows[0].due !== expired.length) return { changed: false, order };
      for (const row of expired) {
        await client.query(`UPDATE public.clearance_products
          SET available_quantity = available_quantity + $1 WHERE id = $2`,
          [row.quantity, row.clearance_product_id]);
      }
      await client.query(`UPDATE public.clearance_reservations SET status = 'EXPIRED'
        WHERE order_id = $1 AND status = 'RESERVED'`, [orderId]);
      await client.query(`UPDATE public.orders SET order_status = 'Expired',
        payment_status = 'Expired', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [orderId]);
      return { changed: true, order };
    }
    throw error('Invalid reservation action.');
  }

  // Expire online clearance reservations only; never touch Stock Control.
  // Lock the order first, as PayFast confirmation does, to serialize races.
  async function sweepExpiredReservations() {
    if (!enabled()) return 0;
    const pending = await pool.query(`
      SELECT DISTINCT r.order_id FROM public.clearance_reservations r
      JOIN public.orders o ON o.id = r.order_id
      WHERE r.status = 'RESERVED' AND r.expires_at <= CURRENT_TIMESTAMP
        AND o.payment_status IS DISTINCT FROM 'Paid'
      ORDER BY r.order_id LIMIT 100`);
    let changed = 0;
    for (const { order_id } of pending.rows) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await transitionReservation(order_id, 'EXPIRED', client);
        await client.query('COMMIT');
        if (result.changed) changed++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('CLEARANCE EXPIRY ERROR:', order_id, err);
      } finally { client.release(); }
    }
    return changed;
  }
  // The interval is intentionally disabled until both production checkout gates pass.
  // Avoid overlapping sweeps within this Node process.
  let expirySweepRunning = false;
  const expiryTimer = setInterval(async () => {
    if (!enabled() || expirySweepRunning) return;
    expirySweepRunning = true;
    try { await sweepExpiredReservations(); }
    catch (err) { console.error('CLEARANCE EXPIRY SWEEP ERROR:', err); }
    finally { expirySweepRunning = false; }
  }, 60000);
  expiryTimer.unref?.();

  // Local-only transactional expiry test. All synthetic orders, reservations and
  // stock changes are rolled back, including when an assertion fails.
  app.post('/clearance-orders/expiry-dry-run', async (req, res) => {
    const ip = req.socket.remoteAddress || '';
    const allowed = process.env.NODE_ENV !== 'production' &&
      process.env.CLEARANCE_LOCAL_DRY_RUN === 'true' &&
      ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip) &&
      ['localhost', '127.0.0.1'].includes(req.hostname);
    if (!allowed) return res.status(403).json({ success: false, error: 'Local expiry test disabled.' });

    let client;
    let rolledBack = false;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const { rows } = await client.query(`
        SELECT id, available_quantity, promotional_price, product_name, pack_size
        FROM public.clearance_products
        WHERE promotion_code = $1 AND available_quantity >= 1
        ORDER BY id LIMIT 1 FOR UPDATE`, [promotionCode]);
      if (!rows.length) throw error('No clearance product with available stock for expiry test.', 409);
      const product = rows[0];
      const initialStock = Number(product.available_quantity);
      const assert = (condition, message) => {
        if (!condition) throw error('Expiry test failed: ' + message, 500);
      };
      const readStock = async () => {
        const r = await client.query('SELECT available_quantity FROM public.clearance_products WHERE id = $1', [product.id]);
        return Number(r.rows[0].available_quantity);
      };
      const createTestOrder = async (suffix, paymentMethod, paymentStatus) => {
        const orderNumber = `SM-CL-EXPIRY-TEST-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${suffix}`;
        const items = JSON.stringify([{
          clearanceProductId: Number(product.id), name: product.product_name,
          size: product.pack_size, qty: 1, price: Number(product.promotional_price), promotionCode
        }]);
        const inserted = await client.query(`
          INSERT INTO public.orders (
            order_number, customer_name, customer_phone, customer_email,
            order_type, delivery_address, customer_notes, items, total_amount,
            delivery_fee, payment_method, ga_client_id, payment_status, order_status
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14)
          RETURNING id`, [orderNumber, 'Local Expiry Test', '0000000000', null,
            'Collection', null, 'Rolled back local expiry test', items,
            Number(product.promotional_price), 0, paymentMethod, null,
            paymentStatus, paymentStatus]);
        const orderId = inserted.rows[0].id;
        await client.query(`UPDATE public.clearance_products
          SET available_quantity = available_quantity - 1 WHERE id = $1`, [product.id]);
        await client.query(`INSERT INTO public.clearance_reservations
          (clearance_product_id, order_id, quantity, status, expires_at)
          VALUES ($1,$2,1,'RESERVED',CURRENT_TIMESTAMP - INTERVAL '1 minute')`,
          [product.id, orderId]);
        return orderId;
      };

      const unpaidId = await createTestOrder('UNPAID', 'EFT', 'Awaiting Payment');
      assert(await readStock() === initialStock - 1, 'initial reservation did not reduce stock');
      const first = await transitionReservation(unpaidId, 'EXPIRED', client);
      const statusResult = await client.query(
        'SELECT status FROM public.clearance_reservations WHERE order_id = $1', [unpaidId]);
      const stockAfterExpiry = await readStock();
      assert(first.changed === true, 'expired reservation not processed');
      assert(statusResult.rows[0]?.status === 'EXPIRED', 'reservation status not EXPIRED');
      assert(stockAfterExpiry === initialStock, 'expired stock not restored exactly once');

      const second = await transitionReservation(unpaidId, 'EXPIRED', client);
      assert(second.changed === false, 'duplicate expiry was processed');
      assert(await readStock() === initialStock, 'duplicate expiry changed stock');

      const paidId = await createTestOrder('PAID', 'PayFast', 'Paid');
      assert(await readStock() === initialStock - 1, 'paid test reservation did not reduce stock');
      const paid = await transitionReservation(paidId, 'EXPIRED', client);
      const paidStatus = await client.query(
        'SELECT status FROM public.clearance_reservations WHERE order_id = $1', [paidId]);
      assert(paid.changed === false, 'paid reservation expired');
      assert(paidStatus.rows[0]?.status === 'RESERVED', 'paid reservation status changed');
      assert(await readStock() === initialStock - 1, 'paid reservation stock was restored');

      await client.query('ROLLBACK');
      rolledBack = true;
      return res.json({ success: true, dryRun: true, rolledBack: true,
        payfastMinutes: 30, eftMinutes: 1440,
        productId: Number(product.id), initialStock,
        expiryRestoredUnits: stockAfterExpiry - (initialStock - 1),
        expiredReservationStatus: 'EXPIRED',
        duplicateExpiryIgnored: !second.changed,
        paidReservationProtected: !paid.changed,
        message: 'Expiry, duplicate protection and paid-order protection verified; all test writes rolled back.' });
    } catch (err) {
      console.error('CLEARANCE EXPIRY DRY RUN ERROR:', err);
      if (client && !rolledBack) {
        try { await client.query('ROLLBACK'); rolledBack = true; }
        catch (rollbackError) { console.error('CLEARANCE EXPIRY TEST ROLLBACK ERROR:', rollbackError); }
      }
      return res.status(err.status || 500).json({ success: false, dryRun: true,
        rolledBack, error: err.status ? err.message : 'Expiry dry run failed.' });
    } finally {
      if (client) {
        if (!rolledBack) {
          try { await client.query('ROLLBACK'); }
          catch (rollbackError) { console.error('CLEARANCE EXPIRY TEST ROLLBACK ERROR:', rollbackError); }
        }
        client.release();
      }
    }
  });

  // Local-only live PayFast payment-page / cancellation test. No order is
  // created and no stock is reserved. NEVER complete payment for this reference.
  app.post('/clearance-orders/payfast-page-test', (req, res) => {
    const ip = req.socket.remoteAddress || '';
    const allowed = process.env.NODE_ENV !== 'production' &&
      process.env.CLEARANCE_LOCAL_DRY_RUN === 'true' &&
      ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip) &&
      ['localhost', '127.0.0.1'].includes(req.hostname);
    if (!allowed) return res.status(403).json({ success: false, error: 'Local payment-page test disabled.' });
    const base = process.env.PAYFAST_URL || '';
    if (base !== 'https://www.payfast.co.za/eng/process') {
      return res.status(409).json({ success: false, error: 'Expected live PayFast payment URL for this cancellation-only test.' });
    }
    if (!process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_MERCHANT_KEY ||
        !process.env.APP_URL || !process.env.BACKEND_URL) {
      return res.status(409).json({ success: false, error: 'PayFast test configuration incomplete.' });
    }
    const crypto = require('crypto');
    const ref = `SM-CL-PAGE-TEST-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const paymentData = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: `${process.env.APP_URL}/payment-success`,
      cancel_url: `${process.env.APP_URL}/payment-cancelled`,
      notify_url: `${process.env.BACKEND_URL}/payfast-notify`,
      name_first: 'Clearance Test',
      email_address: 'test@example.com',
      m_payment_id: ref,
      amount: '14.00',
      item_name: 'Clearance payment page cancellation test'
    };
    const encode = value => encodeURIComponent(String(value)).replace(/%20/g, '+');
    const parts = Object.entries(paymentData).map(([key, value]) => `${key}=${encode(value)}`);
    const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim();
    if (passphrase) parts.push(`passphrase=${encode(passphrase)}`);
    paymentData.signature = crypto.createHash('md5').update(parts.join('&')).digest('hex');
    const url = `${base}?${new URLSearchParams(paymentData).toString()}`;
    res.json({ success: true, testOnly: true, noOrderCreated: true,
      noStockReserved: true, orderReference: ref, amount: 14,
      paymentUrl: url,
      warning: 'Live payment page. Inspect and CANCEL ONLY. Do not complete a payment.' });
  });

  // Only the verified PayFast notification handler can call this method.
  // The caller owns the transaction and must COMMIT/ROLLBACK.
  app.locals.confirmClearanceReservation = async (orderId, client) => {
    const result = await client.query(
      'SELECT payment_method FROM public.orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (!result.rows.length || result.rows[0].payment_method !== 'PayFast') {
      throw error('Not a PayFast clearance order.', 409);
    }
    return transitionReservation(orderId, 'CONFIRMED', client);
  };

  // Local-only payment lifecycle test. Uses the same confirmation function as
  // verified PayFast ITNs and the same transition as authorised EFT reconciliation.
  // This does NOT validate PayFast signatures or make an external payment.
  app.post('/clearance-orders/payment-dry-run', async (req, res) => {
    const ip = req.socket.remoteAddress || '';
    const allowed = process.env.NODE_ENV !== 'production' &&
      process.env.CLEARANCE_LOCAL_DRY_RUN === 'true' &&
      ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip) &&
      ['localhost', '127.0.0.1'].includes(req.hostname);
    if (!allowed) return res.status(403).json({ success: false, error: 'Local payment test disabled.' });

    let client;
    let transactionStarted = false;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      transactionStarted = true;
      const { rows } = await client.query(`
        SELECT id, available_quantity, promotional_price, product_name, pack_size
        FROM public.clearance_products
        WHERE promotion_code = $1 AND available_quantity >= 1
        ORDER BY id LIMIT 1 FOR UPDATE`, [promotionCode]);
      if (!rows.length) throw error('No clearance product available for payment test.', 409);
      const product = rows[0];
      const initialStock = Number(product.available_quantity);
      const assert = (ok, message) => { if (!ok) throw error('Payment test failed: ' + message, 500); };
      const stock = async () => {
        const result = await client.query('SELECT available_quantity FROM public.clearance_products WHERE id = $1', [product.id]);
        return Number(result.rows[0].available_quantity);
      };
      const reservationStatus = async orderId => {
        const result = await client.query('SELECT status FROM public.clearance_reservations WHERE order_id = $1', [orderId]);
        return result.rows[0]?.status;
      };
      const paymentStatus = async orderId => {
        const result = await client.query('SELECT payment_status FROM public.orders WHERE id = $1', [orderId]);
        return result.rows[0]?.payment_status;
      };
      const makeOrder = async (method, expired) => {
        const orderNumber = `SM-CL-PAYMENT-TEST-${Date.now()}-${require('crypto').randomUUID()}`;
        const items = JSON.stringify([{clearanceProductId: Number(product.id),
          name: product.product_name, size: product.pack_size, qty: 1,
          price: Number(product.promotional_price), promotionCode}]);
        const inserted = await client.query(`
          INSERT INTO public.orders (
            order_number, customer_name, customer_phone, customer_email,
            order_type, delivery_address, customer_notes, items, total_amount,
            delivery_fee, payment_method, ga_client_id, payment_status, order_status
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14)
          RETURNING id`, [orderNumber, 'Local Payment Test', '0000000000', null,
            'Collection', null, 'Rollback-only payment lifecycle test', items,
            Number(product.promotional_price), 0, method, null,
            'Awaiting Payment', 'Awaiting Payment']);
        const orderId = inserted.rows[0].id;
        await client.query(`UPDATE public.clearance_products
          SET available_quantity = available_quantity - 1 WHERE id = $1`, [product.id]);
        await client.query(`INSERT INTO public.clearance_reservations
          (clearance_product_id, order_id, quantity, status, expires_at)
          VALUES ($1,$2,1,'RESERVED',CURRENT_TIMESTAMP + ($3::integer * INTERVAL '1 minute'))`,
          [product.id, orderId, expired ? -1 : reservationMinutes(method)]);
        return orderId;
      };

      const payfastId = await makeOrder('PayFast', false);
      assert(await stock() === initialStock - 1, 'PayFast reservation did not reserve one unit');
      const payfastFirst = await app.locals.confirmClearanceReservation(payfastId, client);
      assert(payfastFirst.changed === true, 'PayFast confirmation did not change state');
      assert(await reservationStatus(payfastId) === 'CONFIRMED', 'PayFast reservation not confirmed');
      assert(await paymentStatus(payfastId) === 'Paid', 'PayFast order not paid');
      assert(await stock() === initialStock - 1, 'PayFast confirmation deducted stock again');
      const payfastRepeat = await app.locals.confirmClearanceReservation(payfastId, client);
      assert(payfastRepeat.changed === false, 'duplicate PayFast confirmation was applied');
      assert(await stock() === initialStock - 1, 'duplicate PayFast confirmation changed stock');

      const eftId = await makeOrder('EFT', false);
      assert(await stock() === initialStock - 2, 'EFT reservation did not reserve one unit');
      const eftFirst = await transitionReservation(eftId, 'CONFIRMED', client);
      assert(eftFirst.changed === true, 'EFT confirmation did not change state');
      assert(await reservationStatus(eftId) === 'CONFIRMED', 'EFT reservation not confirmed');
      assert(await paymentStatus(eftId) === 'Paid', 'EFT order not paid');
      assert(await stock() === initialStock - 2, 'EFT confirmation deducted stock again');
      const eftRepeat = await transitionReservation(eftId, 'CONFIRMED', client);
      assert(eftRepeat.changed === false, 'duplicate EFT confirmation was applied');
      assert(await stock() === initialStock - 2, 'duplicate EFT confirmation changed stock');

      // Expired by clock, but not yet swept: confirmation must be rejected.
      const unsweptId = await makeOrder('PayFast', true);
      const unsweptStock = await stock();
      await client.query('SAVEPOINT unswept_payment_rejection');
      let unsweptPaymentRejected = false;
      try { await app.locals.confirmClearanceReservation(unsweptId, client); }
      catch (err) {
        unsweptPaymentRejected = err.status === 409;
        await client.query('ROLLBACK TO SAVEPOINT unswept_payment_rejection');
      }
      assert(unsweptPaymentRejected, 'expired but unswept PayFast reservation was confirmed');
      assert(await reservationStatus(unsweptId) === 'RESERVED', 'unswept rejection changed reservation');
      assert(await paymentStatus(unsweptId) === 'Awaiting Payment', 'unswept rejection changed payment');
      assert(await stock() === unsweptStock, 'unswept rejection changed stock');
      const unsweptExpiry = await transitionReservation(unsweptId, 'EXPIRED', client);
      assert(unsweptExpiry.changed === true, 'unswept reservation could not expire');
      assert(await stock() === unsweptStock + 1, 'unswept expiry did not restore stock');

      const lateId = await makeOrder('PayFast', true);
      const beforeExpiry = await stock();
      const expiry = await transitionReservation(lateId, 'EXPIRED', client);
      assert(expiry.changed === true, 'late-payment reservation did not expire');
      assert(await stock() === beforeExpiry + 1, 'expired reservation stock not restored');
      // A rejected statement would abort a PostgreSQL transaction; isolate the
      // expected rejection in a savepoint and roll back to it before assertions.
      await client.query('SAVEPOINT late_payment_rejection');
      let latePaymentRejected = false;
      try { await app.locals.confirmClearanceReservation(lateId, client); }
      catch (err) {
        latePaymentRejected = err.status === 409;
        await client.query('ROLLBACK TO SAVEPOINT late_payment_rejection');
      }
      assert(latePaymentRejected, 'late PayFast confirmation was not rejected');
      assert(await reservationStatus(lateId) === 'EXPIRED', 'late payment changed expired status');
      assert(await paymentStatus(lateId) === 'Expired', 'late payment changed expired order');
      assert(await stock() === initialStock - 2, 'late payment changed restored stock');

      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.json({success: true, dryRun: true, rolledBack: true,
        productId: Number(product.id), initialStock,
        payfastConfirmed: true, payfastDuplicateIgnored: true,
        eftConfirmed: true, eftDuplicateIgnored: true,
        noDoubleStockDeduction: true, unsweptExpiredPaymentRejected: true, latePayfastRejected: true,
        message: 'Local payment confirmation scenarios passed; all test writes rolled back. External PayFast verification not tested.'});
    } catch (err) {
      console.error('CLEARANCE PAYMENT DRY RUN ERROR:', err);
      return res.status(err.status || 500).json({success: false,
        error: err.status ? err.message : 'Payment dry-run failed; check backend logs.'});
    } finally {
      if (client) {
        if (transactionStarted) {
          try { await client.query('ROLLBACK'); }
          catch (rollbackErr) { console.error('CLEARANCE PAYMENT TEST ROLLBACK ERROR:', rollbackErr); }
        }
        client.release();
      }
    }
  });

  // The current website's admin order-status endpoint has no authentication.
  // Use a separate, fail-closed admin token for clearance status changes.
  app.post('/clearance-orders/:id/reconcile', async (req, res) => {
    const secret = process.env.CLEARANCE_ADMIN_SECRET;
    const supplied = req.get('x-clearance-admin-secret');
    const crypto = require('crypto');
    if (!secret || !supplied ||
        Buffer.byteLength(secret) !== Buffer.byteLength(supplied) ||
        !crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))) {
      return res.status(403).json({ success: false, error: 'Clearance admin access denied.' });
    }
    const action = req.body?.action;
    if (!['CONFIRMED', 'RELEASED'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action.' });
    }
    if (action === 'CONFIRMED') {
      const method = await pool.query('SELECT payment_method FROM public.orders WHERE id = $1', [req.params.id]);
      if (method.rows[0]?.payment_method === 'PayFast') {
        return res.status(409).json({ success: false,
          error: 'PayFast clearance orders require verified PayFast notification.' });
      }
    }
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid order ID.' });
    }
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const result = await transitionReservation(id, action, client);
      await client.query('COMMIT');
      res.json({ success: true, action, changed: result.changed });
    } catch (err) {
      if (client) await client.query('ROLLBACK');
      console.error('CLEARANCE RECONCILIATION ERROR:', err);
      res.status(err.status || 500).json({ success: false, error: err.status ? err.message : 'Reconciliation failed.' });
    } finally {
      if (client) client.release();
    }
  });

  // A successful transaction reserves stock, creates the order, and records
  // the reservation atomically. Do NOT enable until the PayFast ITN,
  // cancellation and manual EFT reconciliation routes are wired to reservations.
  // Local-only dry run: executes the real SQL path, then always rolls back.
  // Requires an explicit temporary environment opt-in; never available in production.
  app.post(['/clearance-orders', '/clearance-orders/dry-run'], async (req, res) => {
    const dryRun = req.path === '/clearance-orders/dry-run';
    const remoteIp = req.socket.remoteAddress || '';
    const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteIp);
    const localTestAllowed = process.env.NODE_ENV !== 'production' &&
      process.env.CLEARANCE_LOCAL_DRY_RUN === 'true' && loopback &&
      ['localhost', '127.0.0.1'].includes(req.hostname);
    if (dryRun && !localTestAllowed) return res.status(403).json({
      success: false, error: 'Local clearance dry run is disabled.'
    });
    if (!dryRun && !enabled()) return res.status(503).json({
      success: false,
      error: 'Clearance checkout is not yet enabled.'
    });

    let client;
    try {
      const body = req.body || {};
      const name = String(body.customerName || '').trim();
      const phone = String(body.customerPhone || '').trim();
      const email = String(body.customerEmail || '').trim();
      const orderType = String(body.orderType || '').trim();
      const paymentMethod = String(body.paymentMethod || '').trim();
      if (!name || !phone || !['Delivery', 'Collection'].includes(orderType)) {
        throw error('Valid customer name, phone and order type are required.');
      }
      if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
        throw error('Select at least one clearance product.');
      }
      if (orderType === 'Delivery' && !String(body.deliveryAddress || '').trim()) {
        throw error('A delivery address is required.');
      }
      // Checkout methods are restricted to the existing options; payment method
      // confirmation/fulfilment is integrated in the next milestone.
      if (!['EFT', 'PayFast'].includes(paymentMethod)) throw error('Choose EFT or PayFast.');

      const quantities = new Map();
      for (const item of body.items) {
        const id = Number(item.clearanceProductId);
        const qty = Number(item.qty);
        if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(qty) || qty <= 0 || qty > 315) {
          throw error('Invalid clearance product or quantity.');
        }
        quantities.set(id, (quantities.get(id) || 0) + qty);
      }
      if ([...quantities.values()].some(qty => qty > 315)) throw error('Quantity limit exceeded.');

      client = await pool.connect();
      await client.query('BEGIN');
      const ids = [...quantities.keys()].sort((a, b) => a - b);
      const { rows } = await client.query(`
        SELECT id, product_name, pack_size, promotional_price, available_quantity
        FROM public.clearance_products
        WHERE promotion_code = $1 AND (active = TRUE OR $3::boolean = TRUE) AND id = ANY($2::bigint[])
        ORDER BY id FOR UPDATE`, [promotionCode, ids, dryRun]);
      if (rows.length !== ids.length) throw error('A selected special is no longer available.', 409);

      let subtotalCents = 0;
      let weightGrams = 0;
      const savedItems = [];
      for (const row of rows) {
        const qty = quantities.get(Number(row.id));
        if (qty > Number(row.available_quantity)) {
          throw error(`Only ${row.available_quantity} packs remain for ${row.product_name} ${row.pack_size}.`, 409);
        }
        const sizeMatch = /^([0-9]+)g$/i.exec(row.pack_size);
        if (!sizeMatch) throw error('Unsupported clearance pack size.', 500);
        const unitCents = money(row.promotional_price);
        if (!Number.isSafeInteger(unitCents) || unitCents < 0) throw error('Invalid stored promotional price.', 500);
        subtotalCents += unitCents * qty;
        weightGrams += Number(sizeMatch[1]) * qty;
        savedItems.push({
          clearanceProductId: Number(row.id),
          name: row.product_name, size: row.pack_size, qty,
          price: unitCents / 100, promotionCode
        });
      }
      const weightKg = weightGrams / 1000;
      let feeCents = 0;
      if (orderType === 'Delivery') {
        const tier = [[5, 69], [10, 119], [15, 179], [20, 249]].find(([max]) => weightKg <= max);
        if (!tier) throw error('Delivery orders over 20 kg are not supported.');
        feeCents = tier[1] * 100;
      }
      const totalCents = subtotalCents + feeCents;
      if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw error('Invalid order total.');

      const orderNumber = `SM-CL-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const inserted = await client.query(`
        INSERT INTO public.orders (
          order_number, customer_name, customer_phone, customer_email,
          order_type, delivery_address, customer_notes, items, total_amount,
          delivery_fee, payment_method, ga_client_id, payment_status, order_status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14)
        RETURNING *`, [
          orderNumber, name, phone, email || null, orderType,
          String(body.deliveryAddress || '').trim() || null,
          String(body.customerNotes || '').slice(0, 2000) || null,
          JSON.stringify(savedItems), totalCents / 100, feeCents / 100,
          paymentMethod || null, body.gaClientId || null,
          'Awaiting Payment', 'Awaiting Payment'
        ]);
      const order = inserted.rows[0];
      for (const item of savedItems) {
        await client.query(`
          UPDATE public.clearance_products
          SET available_quantity = available_quantity - $1
          WHERE id = $2`, [item.qty, item.clearanceProductId]);
        await client.query(`
          INSERT INTO public.clearance_reservations
            (clearance_product_id, order_id, quantity, status, expires_at)
          VALUES ($1,$2,$3,'RESERVED',CURRENT_TIMESTAMP + ($4::integer * INTERVAL '1 minute'))`,
          [item.clearanceProductId, order.id, item.qty, reservationMinutes(paymentMethod)]);
      }
      if (dryRun) {
        // Check that the reservation was actually written inside the transaction.
        const verification = await client.query(`
          SELECT COUNT(*)::int AS reservation_count,
                 COALESCE(SUM(quantity), 0)::int AS reserved_units
          FROM public.clearance_reservations WHERE order_id = $1 AND status = 'RESERVED'`,
          [order.id]);
        const checked = verification.rows[0];
        if (checked.reservation_count !== savedItems.length ||
            checked.reserved_units !== savedItems.reduce((sum, item) => sum + item.qty, 0)) {
          throw error('Dry-run reservation verification failed.', 500);
        }
        await client.query('ROLLBACK');
        client.release();
        client = null;
        return res.json({ success: true, dryRun: true, rolledBack: true,
          orderWouldBeCreated: true, reservationCount: checked.reservation_count,
          reservedUnits: checked.reserved_units, items: savedItems,
          subtotal: subtotalCents / 100, deliveryFee: feeCents / 100,
          totalAmount: totalCents / 100,
          message: 'Transaction rolled back; no order or stock reservation was retained.' });
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, order, subtotal: subtotalCents / 100,
        deliveryFee: feeCents / 100, totalAmount: totalCents / 100 });
    } catch (err) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (rollbackError) { console.error('CLEARANCE ROLLBACK ERROR:', rollbackError); }
      }
      console.error('CLEARANCE ORDER ERROR:', err);
      res.status(err.status || 500).json({ success: false,
        error: err.status ? err.message : 'Unable to reserve clearance products.' });
    } finally {
      if (client) client.release();
    }
  });
};
