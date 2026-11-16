require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const crypto = require("crypto");
const { Resend } = require("resend");
const cookieParser = require("cookie-parser");

const resend = new Resend(process.env.RESEND_API_KEY);

// Clearance orders use the same Resend email notification protocol as normal orders.
const escapeOrderHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));
async function notifyNewClearanceOrder(order) {
  try {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const money = (n) => `R${Number(n || 0).toFixed(2)}`;
    const rows = items.map(i => `<tr><td>${escapeOrderHtml(i.name)}</td><td>${escapeOrderHtml(i.size)}</td><td>${Number(i.qty)}</td><td>${money(i.price)}</td></tr>`).join('');
    const html = `<div style="font-family:Arial,sans-serif;max-width:700px;color:#222">
      <div style="background:#111;color:#d4af37;padding:18px"><h2>THE SNACK MERCHANT</h2><p style="color:#fff">New November Clearance Order</p></div>
      <p><strong>Order:</strong> ${escapeOrderHtml(order.order_number)}</p>
      <p><strong>Customer:</strong> ${escapeOrderHtml(order.customer_name)}<br><strong>Phone:</strong> ${escapeOrderHtml(order.customer_phone)}<br><strong>Email:</strong> ${escapeOrderHtml(order.customer_email || 'Not provided')}</p>
      <p><strong>Fulfilment:</strong> ${escapeOrderHtml(order.order_type)}<br><strong>Address:</strong> ${escapeOrderHtml(order.delivery_address || 'Collection')}<br><strong>Payment:</strong> ${escapeOrderHtml(order.payment_method)} / ${escapeOrderHtml(order.payment_status)}</p>
      <table border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse;width:100%"><tr><th>Product</th><th>Pack</th><th>Qty</th><th>Unit price</th></tr>${rows}</table>
      <p>Delivery: ${money(order.delivery_fee)}<br><strong>Total: ${money(order.total_amount)}</strong></p>
      <p><strong>Notes:</strong> ${escapeOrderHtml(order.customer_notes || 'None')}</p>
      <p>Process this order in the existing Orders Dashboard.</p></div>`;
    const { error } = await resend.emails.send({
      from: 'The Snack Merchant <orders@thesnackmerchant.co.za>',
      to: ['gideon@thesnackmerchant.co.za'],
      subject: `NEW NOVEMBER CLEARANCE ORDER - ${order.order_number}`,
      html
    });
    if (error) throw new Error(error.message || 'Resend email rejected');
    console.log('CLEARANCE EMAIL SENT:', order.order_number);
  } catch (err) {
    console.error('CLEARANCE ORDER EMAIL ERROR:', err);
  }
}

const app = express();
app.locals.notifyClearanceOrder = notifyNewClearanceOrder;

// ================= DATABASE =================

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl:
        process.env.DB_HOST === "127.0.0.1" ||
        process.env.DB_HOST === "localhost"
          ? false
          : { rejectUnauthorized: false },
    });

// ================= MIDDLEWARE =================

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// =====================================================
// STOCK CONTROL 3.0 — SERVER-TO-SERVER CONNECTION
// =====================================================

const STOCK_CONTROL_API_URL = (
  process.env.STOCK_CONTROL_API_URL || ""
).replace(/\/+$/, "");

const CUSTOMER_STOCK_INTEGRATION_SECRET =
  process.env.CUSTOMER_STOCK_INTEGRATION_SECRET || "";

// Public catalogue requests share a short-lived snapshot so each visitor does
// not trigger a separate Stock Control API request. Payment/stock sync still
// calls fetchMainStockAvailability directly and always requests fresh stock.
const CATALOGUE_STOCK_CACHE_MS = 30000;
let catalogueStockSnapshot = null;
let catalogueStockExpiresAt = 0;
let catalogueStockPending = null;

async function fetchCatalogueStockAvailability() {
  if (catalogueStockSnapshot && Date.now() < catalogueStockExpiresAt) {
    return catalogueStockSnapshot;
  }
  if (catalogueStockPending) return catalogueStockPending;

  catalogueStockPending = (async () => {
    const data = await fetchMainStockAvailability();
    catalogueStockSnapshot = data;
    catalogueStockExpiresAt = Date.now() + CATALOGUE_STOCK_CACHE_MS;
    return data;
  })();
  try {
    return await catalogueStockPending;
  } finally {
    catalogueStockPending = null;
  }
}

async function fetchMainStockAvailability() {
  if (
    !STOCK_CONTROL_API_URL ||
    !CUSTOMER_STOCK_INTEGRATION_SECRET
  ) {
    throw new Error("Stock Control integration is not configured");
  }

  const response = await fetch(
    `${STOCK_CONTROL_API_URL}/api/customer-stock-availability`,
    {
      method: "GET",
      headers: {
        "x-customer-stock-secret":
          CUSTOMER_STOCK_INTEGRATION_SECRET,
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Stock Control availability request failed: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.success || !Array.isArray(data.items)) {
    throw new Error("Invalid Stock Control availability response");
  }

  return data;
}
// =====================================================
// CUSTOMER APP - STOCK CONTROL PRODUCT MAPPING
// =====================================================

const CUSTOMER_STOCK_PRODUCT_MAPPING = {
  CNL02: {
    Flakes: "TSM02",
    Ground: "TSM02-1",
    Slivered: "TSM02-2",
  },
  CNL03: {
    Sprinkles: "TSM03",
    Nibs: "TSM03-1",
  },
  CNL08: {
    Raw: "TSM08",
    Salted: "TSM08-1",
    "Peri-Peri": "TSM08-2",
  },
  CNL24: {
    Raw: "TSM24",
    Salted: "TSM24-1",
    "Peri-Peri": "TSM24-2",
  },
  CNL25: {
    BBQ: "TSM25",
    "Tomato Chilli": "TSM25-1",
  },
  CNL26: {
    Salted: "TSM26",
    "Peri-Peri": "TSM26-1",
  },
  CNL116: {
    Plain: "TSM116",
    "Spring Onion": "TSM116-1",
  },
  CNL117: {
    Plain: "TSM117",
    Hot: "TSM117-1",
  },
};

function resolveCustomerStockProductCode(item) {
  const code = String(item.code || "").trim().toUpperCase();
  const option = String(item.option || "").trim();

  const mapping = CUSTOMER_STOCK_PRODUCT_MAPPING[code];

  if (mapping) {
    return mapping[option] || null;
  }

  return code.replace(/^CNL/, "TSM");
}
// =====================================================
// CUSTOMER APP - STOCK CONTROL VARIANT MATCHING
// =====================================================

function normalizeCustomerPackSize(value, unit) {
  if (unit === undefined) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
  }

  return `${value}${unit}`.toLowerCase().replace(/\s+/g, "");
}

function matchCustomerStockVariant(item, stockItems) {
    // November Specials carry their exact approved Stock Control variant.
  // Never try to identify these products by name.
  if (item.isNovemberSpecial) {
    const expectedVariantId = NOVEMBER_SPECIAL_VARIANTS[Number(item.clearanceProductId)];
    if (!expectedVariantId || String(item.stock_variant_id) !== expectedVariantId) {
      throw new Error("Invalid November Specials stock variant mapping");
    }
    return stockItems.find(row => String(row.variant_id) === expectedVariantId) || null;
  }
  // Only Specials may supply an authoritative stock variant ID.
  const productCode = resolveCustomerStockProductCode(item);

  if (!productCode) return null;

  const customerSize = normalizeCustomerPackSize(item.size);

  return (
    stockItems.find((stockItem) => {
      return (
        String(stockItem.product_code || "").toUpperCase() ===
          productCode &&
        normalizeCustomerPackSize(
          stockItem.pack_size_value,
          stockItem.pack_size_unit
        ) === customerSize
      );
    }) || null
  );
}
// =====================================================
// CUSTOMER APP - STOCK FULFILMENT CLASSIFICATION
// =====================================================

function classifyCustomerOrderStock(orderItems, stockItems) {
  const available = new Map();

  for (const stockItem of stockItems) {
    available.set(
      stockItem.variant_id,
      Number(stockItem.quantity_on_hand || 0)
    );
  }

  const stockedItems = [];
  const reviewItems = [];
  const supplierItems = [];

  for (const item of orderItems) {
    const variant = matchCustomerStockVariant(item, stockItems);
    const quantity = Number(item.qty);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Invalid customer order quantity");
    }

    if (!variant || !variant.is_active) {
      // A reserved November Special must never silently become a supplier order.
      if (item.isNovemberSpecial === true) {
        throw new Error('Reserved November Special is missing from active MAIN stock. Manual reconciliation required.');
      }
      supplierItems.push(item);
      continue;
    }

    const remaining = available.get(variant.variant_id) || 0;

    if (remaining < quantity) {
      // Do not partially process a paid mixed order while leaving a Special undeducted.
      if (item.isNovemberSpecial === true) {
        throw new Error('Insufficient MAIN stock to process reserved November Special. Manual reconciliation required.');
      }
      reviewItems.push({
        ...item,
        stock_variant_id: variant.variant_id,
        quantity_available: remaining,
      });
      continue;
    }

    available.set(variant.variant_id, remaining - quantity);

    stockedItems.push({
      ...item,
      stock_variant_id: variant.variant_id,
    });
  }

  return {
    stockedItems,
    reviewItems,
    supplierItems,
  };
}
// =====================================================
// CUSTOMER APP — STOCK CONTROL SALES REQUEST HELPER
// =====================================================

async function sendStockControlSalesRequest(endpoint, payload) {
  if (
    !STOCK_CONTROL_API_URL ||
    !CUSTOMER_STOCK_INTEGRATION_SECRET
  ) {
    throw new Error(
      "Stock Control sales integration is not configured"
    );
  }

  const response = await fetch(
    `${STOCK_CONTROL_API_URL}${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-customer-stock-secret":
          CUSTOMER_STOCK_INTEGRATION_SECRET,
      },
      body: JSON.stringify(payload || {}),
      signal: AbortSignal.timeout(15000),
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
      `Stock Control request failed: ${response.status}`
    );
  }

  return result;
}
// =====================================================
// CUSTOMER APP - STOCK SYNC STATUS TRACKING
// =====================================================
// =====================================================
// CUSTOMER APP - STOCK CONTROL SALE RECOVERY LOOKUP
// =====================================================

async function findExistingCustomerStockSale(orderNumber) {
  if (
    !STOCK_CONTROL_API_URL ||
    !CUSTOMER_STOCK_INTEGRATION_SECRET
  ) {
    throw new Error(
      "Stock Control sales integration is not configured"
    );
  }

  const response = await fetch(
    `${STOCK_CONTROL_API_URL}/api/sales/by-number/${encodeURIComponent(orderNumber)}`,
    {
      method: "GET",
      headers: {
        "x-customer-stock-secret":
          CUSTOMER_STOCK_INTEGRATION_SECRET,
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
      `Stock Control sale lookup failed: ${response.status}`
    );
  }

  return result.found ? result.sale : null;
}
async function updateCustomerStockSyncStatus(
  orderNumber,
  status,
  notes = null
) {
  const result = await pool.query(
    `
    UPDATE public.orders
    SET
      stock_sync_status = $2,
      stock_sync_notes = $3,
      stock_synced_at = CASE
        WHEN $2 = 'PROCESSED' THEN NOW()
        ELSE stock_synced_at
      END,
      updated_at = NOW()
    WHERE order_number = $1
    RETURNING id
    `,
    [orderNumber, status, notes]
  );

  if (result.rowCount !== 1) {
    throw new Error(
      `Unable to update stock sync status for order ${orderNumber}`
    );
  }
}
// =====================================================
// CUSTOMER APP - PAID ORDER STOCK SYNCHRONISATION
// =====================================================

async function syncPaidCustomerOrderToStockControl(order) {
  const orderNumber = String(order.order_number || "").trim();

      if (!orderNumber) {
    throw new Error("Customer order number is missing");
  }

  // November Specials use their own dedicated stock synchronization.
  // Never process these orders through the normal customer sales engine.
  if (orderNumber.startsWith("SM-CL-")) {
    throw new Error(
      "November Specials orders must use their dedicated stock synchronization"
    );
  }

  if (order.payment_status !== "Paid") {
    throw new Error("Only paid customer orders can be synchronised");
  }

  try {
    // Resume an existing sale before attempting to create another.
    const existingSale =
      await findExistingCustomerStockSale(orderNumber);

    if (existingSale) {
      await sendStockControlSalesRequest(
        `/api/sales/${existingSale.id}/process`,
        {}
      );

      await updateCustomerStockSyncStatus(
        orderNumber,
        "PROCESSED",
        "Existing Stock Control sale processed successfully"
      );

      return { success: true, resumed: true };
    }

    const orderItems =
      typeof order.items === "string"
        ? JSON.parse(order.items)
        : order.items;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      throw new Error("Customer order contains no valid items");
    }

    const availability = await fetchMainStockAvailability();

    // Mixed checkout reservations must be represented by their corresponding
    // saved order lines; never silently process an incomplete paid order.
    if (orderItems.some(item => item.isNovemberSpecial === true)) {
      const reservedRows = await pool.query(`SELECT clearance_product_id, SUM(quantity)::integer AS qty
        FROM public.clearance_reservations WHERE order_id = $1 AND status = 'CONFIRMED'
        GROUP BY clearance_product_id`, [order.id]);
      const ordered = new Map();
      for (const item of orderItems.filter(item => item.isNovemberSpecial === true)) {
        const id = Number(item.clearanceProductId);
        ordered.set(id, (ordered.get(id) || 0) + Number(item.qty));
      }
      if (reservedRows.rows.length !== ordered.size || reservedRows.rows.some(row =>
        ordered.get(Number(row.clearance_product_id)) !== Number(row.qty))) {
        throw new Error('Confirmed November Specials reservations do not match the paid order.');
      }
    }

    const classification = classifyCustomerOrderStock(
      orderItems,
      availability.items
    );

    const {
      stockedItems,
      reviewItems,
      supplierItems,
    } = classification;

    // No physical MAIN stock needs to be deducted.
    if (stockedItems.length === 0) {
      const status =
        reviewItems.length > 0
          ? "MANUAL_REVIEW"
          : "SUPPLIER_FULFILMENT";

      await updateCustomerStockSyncStatus(
        orderNumber,
        status,
        JSON.stringify({
          reviewItems,
          supplierItems,
        })
      );

      return { success: true, status };
    }

    const saleItems = stockedItems.map((item) => {
      const unitPrice = Number(item.price);
      const originalPrice = Number(
        item.originalPrice ?? item.price
      );

      const discountPercent =
        item.isNovemberSpecial
          ? Number(
              ((originalPrice - unitPrice) / originalPrice * 100)
                .toFixed(6)
            )
          : 0;

      const discountAmount =
        item.isNovemberSpecial
          ? Number(
              (originalPrice * discountPercent / 100).toFixed(2)
            )
          : 0;

      return {
        variant_id: item.stock_variant_id,
        quantity: Number(item.qty),
        unit_price: unitPrice,
        original_unit_price: originalPrice,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        external_item_reference: item.isNovemberSpecial
          ? `CLEARANCE-${item.clearanceProductId}`
          : String(item.id || ""),
      };
    });

    let created;

try {
  created = await sendStockControlSalesRequest(
    "/api/sales",
    {
        sale_number: orderNumber,
        sales_channel: "ONLINE",
        sales_channel_id:
          "438a2b69-0be0-49d6-9e01-fa4b23104ab2",
        sales_source_id:
          "27fcc1b2-d3b8-421b-a70d-2defe3a71f62",
        location_id:
          "0c252377-005c-4c60-ac2a-6020309d6fea",
        external_reference: orderNumber,
        customer_reference: orderNumber,
        sale_status: "COMPLETED",
        payment_method: String(order.payment_method || "").startsWith("EFT")
          ? "EFT"
          : "PayFast",
        payment_status: "PAID",
        commission_rate: 0,
        items: saleItems,
      }
      );
} catch (createError) {
  const recoveredSale =
    await findExistingCustomerStockSale(orderNumber);

  if (!recoveredSale) {
    throw createError;
  }

  created = { sale: recoveredSale };
}

    await sendStockControlSalesRequest(
      `/api/sales/${created.sale.id}/process`,
      {}
    );

    const status =
  reviewItems.length > 0
    ? "MANUAL_REVIEW"
    : "PROCESSED";

    await updateCustomerStockSyncStatus(
      orderNumber,
      status,
      JSON.stringify({
        reviewItems,
        supplierItems,
        stockSaleId: created.sale.id,
      })
    );

    return { success: true, status };
  } catch (error) {
    await updateCustomerStockSyncStatus(
      orderNumber,
      "SYNC_FAILED",
      error.message
    );

    throw error;
  }
}
// =====================================================
// NOVEMBER SPECIALS — VERIFIED PAID ORDER STOCK SYNC
// =====================================================
// Fixed mapping for the ten approved NOV2026-30 products. Fail closed if
// the catalogue changes; never infer a stock variant from a product name.
const NOVEMBER_SPECIAL_VARIANTS = Object.freeze({
  1: "b3785ee0-0ef2-4035-99a9-690292c8e392",
  2: "e068a584-e906-40f4-9ff0-8e28be16a27f",
  3: "2633e7cc-ba98-4ee2-938e-baba9556cf5b",
  4: "eba0e514-14be-447e-9d75-f89262895b81",
  5: "edf37286-4c93-48f2-8ecf-ffa77ee1289a",
  6: "9902984f-b9d9-499b-9b5f-6031c851199f",
  7: "aaba69f9-f39a-4389-ab67-9742a3f670a0",
  8: "f457a87e-35eb-4ed0-a4f6-d07792de9427",
  9: "19d63ae9-8a3d-4a67-8d8e-b2e14c8e84c0",
  10: "f90f2f7f-dec0-4c0e-8631-7b0576ebd7bb",
});

async function syncPaidNovemberSpecialOrder(orderId) {
  const { rows } = await pool.query(`
    SELECT o.id, o.order_number, o.items, o.payment_method,
           o.payment_status, o.stock_sync_status
    FROM public.orders o
    WHERE o.id = $1 AND o.order_number LIKE 'SM-CL-%'
      AND o.payment_status = 'Paid'
      AND EXISTS (
        SELECT 1 FROM public.clearance_reservations r
        WHERE r.order_id = o.id AND r.status = 'CONFIRMED'
      )`, [orderId]);
  const order = rows[0];
  if (!order) throw new Error('Paid, confirmed November Specials order not found');
  if (order.stock_sync_status === 'PROCESSED') return { success: true, alreadyProcessed: true };

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  if (!Array.isArray(items) || items.length === 0) throw new Error('November Specials order has no items');

  try {
    const existingSale = await findExistingCustomerStockSale(order.order_number);
    if (existingSale) {
      await sendStockControlSalesRequest(`/api/sales/${existingSale.id}/process`, {});
      await updateCustomerStockSyncStatus(order.order_number, 'PROCESSED',
        JSON.stringify({ stockSaleId: existingSale.id, recovered: true }));
      return { success: true, recovered: true };
    }

    const ids = items.map(i => Number(i.clearanceProductId));
    if (ids.some(id => !Number.isSafeInteger(id) || !NOVEMBER_SPECIAL_VARIANTS[id])) {
      throw new Error('Unknown November Specials product mapping; manual review required');
    }
    const catalogue = await pool.query(`
      SELECT id, product_name, pack_size, retail_price, promotional_price
      FROM public.clearance_products
      WHERE promotion_code = 'NOV2026-30' AND id = ANY($1::bigint[])`, [ids]);
    const byId = new Map(catalogue.rows.map(r => [Number(r.id), r]));
    const saleItems = items.map(item => {
      const id = Number(item.clearanceProductId);
      const product = byId.get(id);
      const qty = Number(item.qty);
      const price = Number(item.price);
      if (!product || !Number.isSafeInteger(qty) || qty <= 0 ||
          !Number.isFinite(price) || price < 0 ||
          String(item.name) !== String(product.product_name) ||
          String(item.size) !== String(product.pack_size) ||
          Math.abs(price - Number(product.promotional_price)) > 0.001) {
        throw new Error(`November Specials product ${id} does not match its saved order`);
      }
      const original = Number(product.retail_price);
      if (!Number.isFinite(original) || original <= 0 || price > original) {
        throw new Error(`Invalid November Specials original price for product ${id}`);
      }
      // The sales API independently verifies discount percentage and amount.
      const discountPercent = Number(((original - price) / original * 100).toFixed(6));
      const discountAmount = Number((original * discountPercent / 100).toFixed(2));
      if (Math.abs(Number((original - discountAmount).toFixed(2)) - price) > 0.001) {
        throw new Error(`November Specials discount does not reconcile for product ${id}`);
      }
      return {
        variant_id: NOVEMBER_SPECIAL_VARIANTS[id],
        quantity: qty,
        unit_price: price,
        original_unit_price: original,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        external_item_reference: `CLEARANCE-${id}`,
      };
    });

    const availability = await fetchMainStockAvailability();
    const stockRows = availability.items || [];
    for (const line of saleItems) {
      const stock = stockRows.find(row => row.variant_id === line.variant_id);
      const required = saleItems.filter(i => i.variant_id === line.variant_id)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (!stock || !stock.is_active || Number(stock.quantity_on_hand) < required) {
        throw new Error(`Insufficient MAIN stock for November Specials variant ${line.variant_id}; manual review required`);
      }
    }

    let sale;
    try {
      const created = await sendStockControlSalesRequest('/api/sales', {
        sale_number: order.order_number,
        sales_channel: 'ONLINE',
        sales_channel_id: '438a2b69-0be0-49d6-9e01-fa4b23104ab2',
        sales_source_id: '27fcc1b2-d3b8-421b-a70d-2defe3a71f62',
        location_id: '0c252377-005c-4c60-ac2a-6020309d6fea',
        external_reference: order.order_number,
        customer_reference: order.order_number,
        sale_status: 'COMPLETED',
        payment_status: 'PAID',
        payment_method: order.payment_method === 'EFT' ? 'EFT' : 'PayFast',
        commission_rate: 0,
        items: saleItems,
      });
      sale = created.sale;
    } catch (createError) {
      sale = await findExistingCustomerStockSale(order.order_number);
      if (!sale) throw createError;
    }
    await sendStockControlSalesRequest(`/api/sales/${sale.id}/process`, {});
    await updateCustomerStockSyncStatus(order.order_number, 'PROCESSED',
      JSON.stringify({ stockSaleId: sale.id, promotionCode: 'NOV2026-30' }));
    return { success: true, stockSaleId: sale.id };
  } catch (err) {
    await updateCustomerStockSyncStatus(order.order_number, 'SYNC_FAILED', err.message);
    throw err;
  }
}
app.locals.syncPaidNovemberSpecialOrder = syncPaidNovemberSpecialOrder;
app.locals.fetchMainStockAvailability = fetchCatalogueStockAvailability;

// =====================================================
// CUSTOMER APP — STOCK AVAILABILITY PROXY
// =====================================================
app.get("/customer-stock-availability", async (req, res) => {
  try {
    const data = await fetchCatalogueStockAvailability();

    return res.json({
      success: true,
      location_code: "MAIN",
      items: data.items,
    });
  } catch (error) {
    console.error("Customer stock availability error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Stock availability is temporarily unavailable",
    });
  }
});
// Administrator authentication endpoints
const { router: adminAuthRouter, requireAdminAuth } = require("./admin-auth");
app.use("/admin-auth", adminAuthRouter);

// ================= UPLOADS FOLDER =================

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ================= IMAGE STORAGE =================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s/g, "_");

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ================= STATIC IMAGE ACCESS =================

app.use("/uploads", express.static(uploadsDir));

// ================= TEST ROUTE =================

app.get("/", (req, res) => {
  res.json({
    status: "Snack Merchant Backend Running",
  });
});
// ================= VISITOR COOKIE =================

app.get("/visitor", (req, res) => {
  let visitorId = req.cookies.visitor_id;

  if (!visitorId) {
    visitorId = crypto.randomUUID();

    res.cookie("visitor_id", visitorId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  res.json({
    success: true,
    visitorId,
  });
});
// ================= IMAGE UPLOAD ROUTE =================

app.post("/upload", requireAdminAuth, upload.single("image"), async (req, res) => {
  try {
    const { productCode } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: "No image uploaded",
      });
    }

    if (!productCode) {
      return res.status(400).json({
        error: "Product code is required",
      });
    }

    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    await pool.query(
      `
      INSERT INTO public.product_images (product_code, image_url)
      VALUES ($1, $2)
      ON CONFLICT (product_code)
      DO UPDATE SET image_url = EXCLUDED.image_url
      `,
      [productCode, imageUrl]
    );

    res.json({
      success: true,
      productCode,
      imageUrl,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    res.status(500).json({
      error: "Upload failed",
      details: err.message,
    });
  }
});

// ================= LOAD PRODUCT IMAGES =================

app.get("/product-images", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT product_code, image_url FROM public.product_images"
    );

    const images = {};

    result.rows.forEach((row) => {
      images[row.product_code] = row.image_url;
    });

    res.json(images);
  } catch (err) {
    console.error("LOAD IMAGES ERROR:", err);

    res.status(500).json({
      error: "Failed to load product images",
      details: err.message,
    });
  }
});

// ================= SAVE PRODUCT STOCK STATUS =================

app.post("/product-stock", requireAdminAuth, async (req, res) => {
  try {
    const { productCode, stockStatus } = req.body;

    if (!productCode || !stockStatus) {
      return res.status(400).json({
        error: "Product code and stock status are required",
      });
    }

    await pool.query(
      `
      INSERT INTO public.product_stock (product_code, stock_status, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (product_code)
      DO UPDATE SET
        stock_status = EXCLUDED.stock_status,
        updated_at = CURRENT_TIMESTAMP
      `,
      [productCode, stockStatus]
    );

    res.json({
      success: true,
      productCode,
      stockStatus,
    });
  } catch (err) {
    console.error("SAVE STOCK ERROR:", err);

    res.status(500).json({
      error: "Failed to save stock status",
      details: err.message,
    });
  }
});

// ================= LOAD PRODUCT STOCK STATUS =================

app.get("/product-stock", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT product_code, stock_status FROM public.product_stock"
    );

    const stock = {};

    result.rows.forEach((row) => {
      stock[row.product_code] = row.stock_status;
    });

    res.json(stock);
  } catch (err) {
    console.error("LOAD STOCK ERROR:", err);

    res.status(500).json({
      error: "Failed to load stock status",
      details: err.message,
    });
  }
});

// ================= START SERVER =================
// ================= PRODUCT STOCK ROUTES =================

app.get("/product-stock", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT product_code, stock_status
      FROM public.product_stock
    `);

    const stock = {};

    result.rows.forEach((row) => {
      stock[row.product_code] = row.stock_status;
    });

    res.json(stock);
  } catch (err) {
    console.error("LOAD STOCK ERROR:", err);
    res.status(500).json({
      error: "Failed to load stock",
      details: err.message,
    });
  }
});

app.post("/product-stock", requireAdminAuth, async (req, res) => {
  try {
    const { productCode, stockStatus } = req.body;

    await pool.query(
      `
      INSERT INTO public.product_stock 
        (product_code, stock_status, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (product_code)
      DO UPDATE SET
        stock_status = EXCLUDED.stock_status,
        updated_at = CURRENT_TIMESTAMP
      `,
      [productCode, stockStatus || "In Stock"]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("SAVE STOCK ERROR:", err);
    res.status(500).json({
      error: "Failed to save stock",
      details: err.message,
    });
  }
});

// ================= PRODUCT PRICING ROUTES =================

app.get("/product-pricing", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pricing_key, wholesale_price
      FROM public.product_pricing
    `);

    const pricing = {};

    result.rows.forEach((row) => {
      pricing[row.pricing_key] = Number(row.wholesale_price);
    });

    res.json(pricing);
  } catch (err) {
    console.error("LOAD PRICING ERROR:", err);
    res.status(500).json({
      error: "Failed to load product pricing",
      details: err.message,
    });
  }
});

app.post("/product-pricing", requireAdminAuth, async (req, res) => {
  try {
    const { key, wholesalePrice } = req.body;

    await pool.query(
      `
      INSERT INTO public.product_pricing
        (pricing_key, wholesale_price, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (pricing_key)
      DO UPDATE SET
        wholesale_price = EXCLUDED.wholesale_price,
        updated_at = CURRENT_TIMESTAMP
      `,
      [key, Number(wholesalePrice)]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("SAVE PRICING ERROR:", err);
    res.status(500).json({
      error: "Failed to save product pricing",
      details: err.message,
    });
  }
});

// Clearance catalogue is isolated from the normal shop and remains inactive until approved.
require('./clearance-routes')(app, pool, requireAdminAuth);

// ================= LOAD ORDERS =================

app.get("/orders", requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*,
        EXISTS (SELECT 1 FROM public.clearance_reservations r WHERE r.order_id = o.id) AS is_clearance,
        (SELECT CASE WHEN COUNT(*) = 0 THEN NULL
          WHEN COUNT(DISTINCT r.status) = 1 THEN MIN(r.status)
          ELSE 'MIXED' END
         FROM public.clearance_reservations r WHERE r.order_id = o.id) AS clearance_reservation_status
      FROM public.orders o
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("LOAD ORDERS ERROR:", err);

    res.status(500).json({
      error: "Failed to load orders",
      details: err.message,
    });
  }
});


// ================= UPDATE ORDER STATUS =================

app.patch("/orders/:id/status", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, orderStatus } = req.body;

    // November Specials use their own verified reconciliation.
   const clearanceGuard = await pool.query(
  `SELECT 1
   FROM public.orders o
   WHERE o.id = $1
     AND (
       EXISTS (
         SELECT 1
         FROM public.clearance_reservations r
         WHERE r.order_id = o.id
       )
       OR EXISTS (
         SELECT 1
         FROM jsonb_array_elements(o.items::jsonb) AS item
         WHERE item->>'isNovemberSpecial' = 'true'
       )
     )
   LIMIT 1`,
  [id]
);
    if (clearanceGuard.rowCount) {
      const existing = await pool.query('SELECT * FROM public.orders WHERE id = $1', [id]);
      const order = existing.rows[0];
      if (!order || String(order.order_number).startsWith('SM-CL-') ||
          !String(order.payment_method || '').startsWith('EFT')) {
        return res.status(409).json({success:false,error:'Use verified clearance reconciliation for this order.'});
      }
      if (paymentStatus !== 'Paid' || (order.payment_status === 'Paid' && order.stock_sync_status === 'PROCESSED')) {
        return res.status(409).json({success:false,error:'Use verified EFT confirmation for mixed orders.'});
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await app.locals.transitionClearanceReservation(id, 'CONFIRMED', client);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        return res.status(err.status || 409).json({success:false,error:err.message});
      } finally { client.release(); }
      const paid = await pool.query('SELECT * FROM public.orders WHERE id = $1', [id]);
      let stockSync;
      try { stockSync = await syncPaidCustomerOrderToStockControl(paid.rows[0]); }
      catch (err) { stockSync = {success:false,requiresReview:true,error:err.message}; }
      return res.json({success:true,order:paid.rows[0],stockSync});
    }

    // Read the existing order before updating its status.
    const existingResult = await pool.query(
      "SELECT * FROM public.orders WHERE id = $1",
      [id]
    );

    const existingOrder = existingResult.rows[0];

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: "Order not found.",
      });
    }

    const result = await pool.query(
      `
      UPDATE public.orders
      SET
        payment_status = COALESCE($1, payment_status),
        order_status = COALESCE($2, order_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
      `,
      [paymentStatus || null, orderStatus || null, id]
    );

    const updatedOrder = result.rows[0];
    let stockSync = null;

    // Only synchronise confirmed, paid EFT orders.
    // Never use an admin status change to bypass PayFast verification.
    if (
      String(updatedOrder.payment_method || "").startsWith("EFT") &&
      updatedOrder.payment_status === "Paid" &&
      updatedOrder.stock_sync_status !== "PROCESSED" &&
      updatedOrder.stock_sync_status !== "SUPPLIER_FULFILMENT" &&
      updatedOrder.stock_sync_status !== "MANUAL_REVIEW"
    ) {
      try {
        stockSync = await syncPaidCustomerOrderToStockControl(updatedOrder);
      } catch (syncError) {
        console.error(
          "EFT STOCK SYNC FAILED:",
          updatedOrder.order_number,
          syncError
        );

        stockSync = {
          success: false,
          requiresReview: true,
          error: syncError.message,
        };
      }
    }

    return res.json({
      success: true,
      order: updatedOrder,
      stockSync,
    });
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Failed to update order status",
      details: err.message,
    });
  }
});
// ================= ADMIN ORDER STATUS ONLY =================
// Administrative status changes only.
// Does NOT change payment status, reservations, stock or sales.

app.patch("/orders/:id/admin-status", requireAdminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { orderStatus } = req.body || {};

    const allowedStatuses = [
      "New Order",
      "Pending Stock Confirmation",
      "Collection Approved",
      "Converted to PUDO Delivery",
      "Awaiting Payment",
      "Paid",
      "Ready for Collection",
      "Dispatched",
      "Closed",
      "Cancelled",
    ];

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !allowedStatuses.includes(orderStatus)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid order status request.",
      });
    }

    const result = await pool.query(
      `
      UPDATE public.orders
      SET order_status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, order_number, order_status
      `,
      [orderStatus, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: "Order not found.",
      });
    }

    return res.json({
      success: true,
      order: result.rows[0],
    });
  } catch (err) {
    console.error("ADMIN ORDER STATUS ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Unable to update order status.",
    });
  }
});

// ================= CREATE ORDER =================
// Mixed November Specials orders:
// Validate promotional prices and available MAIN stock before saving.
// Create order and promotional reservations in one database transaction.
// Preserve the existing checkout and paid-order Stock Control sync.
app.post("/orders", async (req, res) => {
  let orderClient = null;
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      orderType,
      deliveryAddress,
      customerNotes,
      items,
      totalAmount,
      deliveryFee,
      paymentMethod,
      gaClientId,
    } = req.body;

    if (!customerName || !customerPhone || !orderType || !items || !totalAmount) {
      return res.status(400).json({
        error: "Missing required order fields",
      });
    }
    // Validate the structure and quantities of every submitted item.
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Your cart is empty or invalid.",
      });
    }

    for (const item of items) {
      const qty = Number(item.qty);
      const price = Number(item.price);

      if (
        !Number.isSafeInteger(qty) ||
        qty <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Your cart contains an invalid quantity or price.",
        });
      }
    }

    // Prevent a submitted total from differing from the cart.
    const subtotalCents = items.reduce(
      (sum, item) =>
        sum + Math.round(Number(item.price) * 100) * Number(item.qty),
      0
    );

    const feeCents = Math.round(Number(deliveryFee || 0) * 100);
    const submittedTotalCents = Math.round(Number(totalAmount) * 100);

    if (
      !Number.isSafeInteger(subtotalCents) ||
      !Number.isSafeInteger(feeCents) ||
      feeCents < 0 ||
      !Number.isSafeInteger(submittedTotalCents) ||
      submittedTotalCents !== subtotalCents + feeCents
    ) {
      return res.status(400).json({
        success: false,
        error: "Order total does not match the cart. Please refresh and try again.",
      });
    }
        // Independently verify November Specials against saved catalogue prices.
    const specialItems = items.filter(
      (item) => item.isNovemberSpecial === true
    );
    if (items.some(item => item.clearanceProductId != null && item.isNovemberSpecial !== true)) {
      return res.status(400).json({success:false,error:'Invalid promotional cart item.'});
    }

    if (specialItems.length > 0) {
      const specialIds = specialItems.map((item) =>
        Number(item.clearanceProductId)
      );

      if (
        specialIds.some(
          (id) => !Number.isSafeInteger(id) || !NOVEMBER_SPECIAL_VARIANTS[id]
        )
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid November Specials product.",
        });
      }

      const specialResult = await pool.query(
        `SELECT id, product_name, pack_size, promotional_price, retail_price, active
         FROM public.clearance_products
         WHERE promotion_code = 'NOV2026-30'
           AND id = ANY($1::bigint[])`,
        [specialIds]
      );

      const specialsById = new Map(
        specialResult.rows.map((row) => [Number(row.id), row])
      );

      for (const item of specialItems) {
        const id = Number(item.clearanceProductId);
        const product = specialsById.get(id);

        if (
          !product ||
          !product.active ||
          String(item.name) !== String(product.product_name) ||
          String(item.size) !== String(product.pack_size) ||
          Math.abs(Number(item.price) - Number(product.promotional_price)) > 0.001 ||
          Math.abs(Number(item.originalPrice) - Number(product.retail_price)) > 0.001 ||
          String(item.stock_variant_id) !== NOVEMBER_SPECIAL_VARIANTS[id]
        ) {
          return res.status(409).json({
            success: false,
            error: "A November Special has changed. Please refresh your cart.",
          });
        }
      }
    }
        // Mixed checkout: reserve November Specials atomically with order creation.
    const hasNovemberSpecials = specialItems.length > 0;
    const orderNumber = `SM-${Date.now()}`;

    let specialQuantities = new Map();
    let liveSpecialAvailable = new Map();
    if (hasNovemberSpecials) {
      if (process.env.CLEARANCE_CHECKOUT_ENABLED !== 'true' ||
          process.env.CLEARANCE_PAYMENT_INTEGRATION_VERIFIED !== 'true') {
        return res.status(503).json({success:false,error:'November Specials checkout is not enabled.'});
      }
     if (!['PayFast', 'EFT', 'EFT / Proof of Payment'].includes(paymentMethod)) {
  return res.status(400).json({success:false,error:'Choose PayFast or EFT for November Specials.'});
}
      // Serialize mixed reservations with the dedicated Specials checkout.
      orderClient = await pool.connect();
      await orderClient.query('BEGIN');
      try {
        for (const item of specialItems) {
          const id = Number(item.clearanceProductId);
          specialQuantities.set(id, (specialQuantities.get(id) || 0) + Number(item.qty));
        }
        const ids = [...specialQuantities.keys()].sort((a, b) => a - b);
        const locked = await orderClient.query(`SELECT id, product_name, pack_size,
          promotional_price, retail_price, active FROM public.clearance_products
          WHERE promotion_code = 'NOV2026-30' AND id = ANY($1::bigint[])
          ORDER BY id FOR UPDATE`, [ids]);
        if (locked.rows.length !== ids.length) throw new Error('Special no longer available');
        const byId = new Map(locked.rows.map(row => [Number(row.id), row]));
        for (const item of specialItems) {
          const row = byId.get(Number(item.clearanceProductId));
          if (!row || !row.active || String(item.name) !== String(row.product_name) ||
              String(item.size) !== String(row.pack_size) ||
              Math.round(Number(item.price) * 100) !== Math.round(Number(row.promotional_price) * 100) ||
              Math.round(Number(item.originalPrice) * 100) !== Math.round(Number(row.retail_price) * 100) ||
              String(item.stock_variant_id) !== NOVEMBER_SPECIAL_VARIANTS[Number(row.id)]) {
            const err = new Error('A November Special changed; refresh your cart.');
            err.status = 409; throw err;
          }
        }
        const stock = await fetchMainStockAvailability();
        const byVariant = new Map(stock.items.map(row => [String(row.variant_id), row]));
        const reserved = await orderClient.query(`SELECT r.clearance_product_id,
          COALESCE(SUM(r.quantity),0)::int AS qty FROM public.clearance_reservations r
          JOIN public.orders o ON o.id = r.order_id
          WHERE r.clearance_product_id = ANY($1::bigint[])
            AND (r.status = 'RESERVED' OR (r.status = 'CONFIRMED'
              AND o.stock_sync_status IS DISTINCT FROM 'PROCESSED'))
          GROUP BY r.clearance_product_id`, [ids]);
        const reservedById = new Map(reserved.rows.map(row => [Number(row.clearance_product_id), Number(row.qty)]));
        for (const id of ids) {
          const stockRow = byVariant.get(NOVEMBER_SPECIAL_VARIANTS[id]);
          const available = stockRow && stockRow.is_active
            ? Math.max(0, Number(stockRow.quantity_on_hand) - (reservedById.get(id) || 0)) : 0;
          liveSpecialAvailable.set(id, available);
          if (specialQuantities.get(id) > available) {
            const err = new Error(`Only ${available} packs remain for November Special ${id}.`);
            err.status = 409; throw err;
          }
        }
      } catch (err) {
        await orderClient.query('ROLLBACK');
        orderClient.release(); orderClient = null;
        return res.status(err.status || 503).json({success:false,error:err.message});
      }
    }

    const result = await (orderClient || pool).query(
      `
      INSERT INTO public.orders (
  order_number,
  customer_name,
  customer_phone,
  customer_email,
  order_type,
  delivery_address,
  customer_notes,
  items,
  total_amount,
  delivery_fee,
  payment_method,
  ga_client_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
      `,
      [
        orderNumber,
        customerName,
        customerPhone,
        customerEmail,
        orderType,
        deliveryAddress || null,
        customerNotes || null,
        JSON.stringify(items),
        totalAmount,
        deliveryFee || 0,
        paymentMethod,
        gaClientId || null,
      ]
    );

    const savedOrder = result.rows[0];

    if (hasNovemberSpecials) {
      for (const [id, qty] of specialQuantities) {
        await orderClient.query(`UPDATE public.clearance_products
          SET available_quantity = $1 WHERE id = $2`,
          [liveSpecialAvailable.get(id) - qty, id]);
        await orderClient.query(`INSERT INTO public.clearance_reservations
          (clearance_product_id, order_id, quantity, status, expires_at)
          VALUES ($1, $2, $3, 'RESERVED', CURRENT_TIMESTAMP + ($4::integer * INTERVAL '1 minute'))`,
          [id, savedOrder.id, qty, paymentMethod === 'PayFast' ? 30 : 1440]);
      }
    }
    if (orderClient) {
      await orderClient.query('COMMIT');
      orderClient.release();
      orderClient = null;
    }

    // ================= NEW ORDER EMAIL NOTIFICATION =================

    try {
      const orderItems = Array.isArray(items) ? items : [];

      const itemRows = orderItems
        .map((item) => {
          const itemName = item.name || item.product || "Product";
          const itemSize = item.size || "";
          const itemQty = Number(item.qty || item.quantity || 0);
          const itemPrice = Number(item.price || 0);

          return `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                ${itemName}
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                ${itemSize}
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">
                ${itemQty}
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">
                R${itemPrice.toFixed(2)}
              </td>
            </tr>
          `;
        })
        .join("");

      const { data, error } = await resend.emails.send({
        from: "The Snack Merchant <orders@thesnackmerchant.co.za>",
        to: ["gideon@thesnackmerchant.co.za"],
        subject: `NEW ONLINE ORDER - ${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #222; max-width: 700px; margin: 0 auto;">
            <div style="background: #111; color: #d4af37; padding: 20px;">
              <h1 style="margin: 0; font-size: 24px;">
                THE SNACK MERCHANT
              </h1>
              <p style="margin: 6px 0 0; color: #fff;">
                New Online Order Notification
              </p>
            </div>

            <div style="padding: 20px;">
              <h2 style="color: #b8860b;">
                New Order Received
              </h2>

              <p>
                A new customer order has been successfully submitted through the online store.
              </p>

              <h3>Order Details</h3>

              <p>
                <strong>Order Number:</strong> ${orderNumber}<br>
                <strong>Customer:</strong> ${customerName}<br>
                <strong>Phone:</strong> ${customerPhone}<br>
                <strong>Email:</strong> ${customerEmail || "Not provided"}<br>
                <strong>Order Type:</strong> ${orderType}<br>
                <strong>Payment Method:</strong> ${paymentMethod || "Not specified"}
              </p>

              ${
                deliveryAddress
                  ? `
                    <p>
                      <strong>Delivery Address:</strong><br>
                      ${deliveryAddress}
                    </p>
                  `
                  : ""
              }

              <h3>Order Items</h3>

              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #111; color: #d4af37;">
                    <th style="padding: 8px; text-align: left;">Product</th>
                    <th style="padding: 8px; text-align: left;">Size</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Price</th>
                  </tr>
                </thead>

                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <div style="margin-top: 20px; font-size: 18px;">
                <strong>Delivery Fee:</strong>
                R${Number(deliveryFee || 0).toFixed(2)}
                <br>

                <strong>Order Total:</strong>
                R${Number(totalAmount).toFixed(2)}
              </div>

              ${
                customerNotes
                  ? `
                    <div style="margin-top: 20px;">
                      <strong>Customer Notes:</strong>
                      <p>${customerNotes}</p>
                    </div>
                  `
                  : ""
              }

              <div style="margin-top: 25px; padding: 15px; background: #f5f5f5;">
                <strong>Action Required:</strong>
                Open the Snack Merchant Admin Orders Dashboard to review and process this order.
              </div>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("ORDER NOTIFICATION EMAIL ERROR:", error);
      } else {
        console.log(
          `ORDER NOTIFICATION EMAIL SENT: ${orderNumber}`,
          data?.id || ""
        );
      }
    } catch (emailError) {
      console.error(
        "ORDER NOTIFICATION EMAIL ERROR:",
        emailError
      );
    }

    // ================= END EMAIL NOTIFICATION =================

    res.json({
      success: true,
      order: savedOrder,
    });
  } catch (err) {
    if (orderClient) {
      try { await orderClient.query('ROLLBACK'); } catch (rollbackError) {
        console.error('MIXED ORDER ROLLBACK ERROR:', rollbackError);
      }
      orderClient.release();
    }
    console.error("CREATE ORDER ERROR:", err);

    res.status(500).json({
      error: "Failed to create order",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
const sendGA4Event = async (clientId, eventName, params = {}) => {
  try {
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
      console.warn("GA4 Measurement Protocol credentials missing");
      return;
    }

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          events: [
            {
              name: eventName,
              params,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error("GA4 EVENT ERROR:", response.status);
    }
  } catch (err) {
    console.error("GA4 EVENT ERROR:", err);
  }
};

// Clearance PayFast notifications are verified independently of the legacy flow.
// Signature, merchant, order amount and PayFast server validation must ALL pass.
async function verifyClearancePayFastITN(itn, order) {
  const expectedMerchant = process.env.PAYFAST_MERCHANT_ID;
  if (!expectedMerchant || String(itn.merchant_id || '') !== expectedMerchant) return false;
  const actualCents = Math.round(Number(itn.amount_gross) * 100);
  const expectedCents = Math.round(Number(order.total_amount) * 100);
  if (!Number.isSafeInteger(actualCents) || actualCents !== expectedCents) return false;
  const suppliedSignature = String(itn.signature || '').toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(suppliedSignature)) return false;
  const fields = Object.entries(itn)
    .filter(([key, value]) => key !== 'signature' && value !== undefined && value !== null && String(value) !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, '+')}`);
  const passphrase = String(process.env.PAYFAST_PASSPHRASE || '').trim();
  if (passphrase) fields.push(`passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`);
  const calculated = crypto.createHash('md5').update(fields.join('&')).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(suppliedSignature), Buffer.from(calculated))) return false;
  const configured = String(process.env.PAYFAST_URL || '');
  const sandbox = configured.includes('sandbox.payfast.co.za');
  const validationUrl = sandbox
    ? 'https://sandbox.payfast.co.za/eng/query/validate'
    : 'https://www.payfast.co.za/eng/query/validate';
  const validationBody = Object.entries(itn)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value)).replace(/%20/g, '+')}`)
    .join('&');
  const response = await fetch(validationUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: validationBody, signal: AbortSignal.timeout(10000)
  });
  return response.ok && (await response.text()).trim() === 'VALID';
}

// ================= PAYFAST ITN ROUTE =================

app.post("/payfast-notify", async (req, res) => {
  try {
    const itn = req.body;

    // Do not log the full notification: it may contain customer and payment data.
    console.log("PAYFAST ITN RECEIVED:", { orderNumber: itn?.m_payment_id, status: itn?.payment_status });

    const orderNumber = itn.m_payment_id;
    const paymentStatus = itn.payment_status;
    const paymentAmount = Number(itn.amount_gross || 0);

    if (!orderNumber) {
      return res.status(400).send("Missing m_payment_id");
    }

    // Clearance ITNs require signature, amount and PayFast server validation.
    // Route by reserved order-number namespace, including unknown/deleted orders.
    // Never allow clearance-prefixed notifications to reach legacy status updates.
    if (String(orderNumber).startsWith("SM-CL-")) {
      const exists = await pool.query(
        "SELECT 1 FROM public.orders WHERE order_number = $1 LIMIT 1", [orderNumber]);
      if (!exists.rowCount) return res.status(404).send("Unknown clearance order");
    }
    const clearanceGuard = await pool.query(`
      SELECT 1 FROM public.orders o
      JOIN public.clearance_reservations r ON r.order_id = o.id
      WHERE o.order_number = $1 LIMIT 1`, [orderNumber]);
    if (clearanceGuard.rowCount) {
      const lookup = await pool.query(`
        SELECT DISTINCT o.id, o.total_amount, o.payment_method
        FROM public.orders o
        JOIN public.clearance_reservations r ON r.order_id = o.id
        WHERE o.order_number = $1`, [orderNumber]);
      const order = lookup.rows[0];
      if (!order || order.payment_method !== 'PayFast' ||
          !await verifyClearancePayFastITN(itn, order)) {
        console.error('CLEARANCE PAYFAST ITN REJECTED:', orderNumber);
        return res.status(400).send('Invalid clearance payment notification');
      }
      if (paymentStatus === 'COMPLETE') {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await app.locals.confirmClearanceReservation(order.id, client);
          await client.query('COMMIT');
          // Only after verified payment and committed reservation confirmation.
          // Do not return an ITN error if stock sync fails: retry is safe.
          try {
            if (String(orderNumber).startsWith('SM-CL-')) {
              await app.locals.syncPaidNovemberSpecialOrder(order.id);
            } else {
              const mixedPaid = await pool.query('SELECT * FROM public.orders WHERE id = $1', [order.id]);
              await syncPaidCustomerOrderToStockControl(mixedPaid.rows[0]);
            }
          } catch (syncError) {
            console.error('CLEARANCE STOCK SYNC FAILED:', orderNumber, syncError);
          }
        } catch (err) {
          await client.query('ROLLBACK');
          console.error('CLEARANCE PAYMENT RECONCILIATION FAILED:', err);
          return res.status(500).send('Clearance reconciliation failed');
        } finally { client.release(); }
      }
      // FAILED/CANCELLED notifications are verified but never release stock
      // automatically: an EFT/manual reconciliation or delayed payment may exist.
      return res.status(200).send('OK');
    }

    if (String(orderNumber).startsWith("SM-CL-")) {
      return res.status(409).send("Clearance reservation missing; manual reconciliation required");
    }

    // Normal orders must pass the same independent PayFast checks as clearance.
    const normalOrderResult = await pool.query(
  `SELECT id, order_number, items, total_amount,
        payment_method, payment_status, stock_sync_status
 FROM public.orders
 WHERE order_number = $1
 LIMIT 1`,
  [orderNumber]
);
    const normalOrder = normalOrderResult.rows[0];
    if (!normalOrder) return res.status(404).send("Unknown order");
    if (normalOrder.payment_method !== "PayFast" ||
        !await verifyClearancePayFastITN(itn, normalOrder)) {
      console.error("NORMAL PAYFAST ITN REJECTED:", orderNumber);
      return res.status(400).send("Invalid payment notification");
    }
    if (!["COMPLETE", "FAILED", "CANCELLED"].includes(paymentStatus)) {
      return res.status(400).send("Unsupported payment status");
    }

    let newPaymentStatus = "Awaiting Payment";
    let newOrderStatus = "Awaiting Payment";

    if (paymentStatus === "COMPLETE") {
      newPaymentStatus = "Paid";
      newOrderStatus = "Paid";
    } else if (
      paymentStatus === "FAILED" ||
      paymentStatus === "CANCELLED"
    ) {
      newPaymentStatus = paymentStatus === "FAILED" ? "Payment Failed" : "Cancelled";
      newOrderStatus = paymentStatus === "FAILED" ? "Payment Failed" : "Cancelled";
    }

   const updateResult = await pool.query(
  `
  UPDATE public.orders
  SET
  payment_status = CASE
  WHEN payment_status = 'Paid' THEN payment_status
  ELSE $1
END,
order_status = CASE
  WHEN payment_status = 'Paid' OR $1 = 'Paid' THEN 'Paid'
  ELSE $2
END,  
    updated_at = CURRENT_TIMESTAMP
  WHERE order_number = $3
  AND payment_status IS DISTINCT FROM 'Paid'
RETURNING *
  `,
  [newPaymentStatus, newOrderStatus, orderNumber]
);
const updatedOrder = updateResult.rows[0];
if (
  paymentStatus === "COMPLETE" &&
  updatedOrder &&
  updatedOrder.ga_client_id
) {
  await sendGA4Event(
    updatedOrder.ga_client_id,
    "purchase",
    {
      transaction_id: orderNumber,
      value: paymentAmount,
      currency: "ZAR",
    }
  );

  console.log("GA4 PURCHASE SENT:", orderNumber);
}
    // Synchronise verified, paid customer orders with Stock Control.
if (paymentStatus === "COMPLETE") {
  try {
    const paidOrderResult = await pool.query(
      `SELECT order_number, items, payment_method,
              payment_status, stock_sync_status
       FROM public.orders
       WHERE order_number = $1
       LIMIT 1`,
      [orderNumber]
    );

    const paidOrder = paidOrderResult.rows[0];

    if (!paidOrder || paidOrder.payment_status !== "Paid") {
      throw new Error("Verified customer order is not marked Paid");
    }

    if (paidOrder.stock_sync_status !== "PROCESSED" &&
        paidOrder.stock_sync_status !== "SUPPLIER_FULFILMENT" &&
        paidOrder.stock_sync_status !== "MANUAL_REVIEW") {
      await syncPaidCustomerOrderToStockControl(paidOrder);
    }
  } catch (stockSyncError) {
    console.error(
      "CUSTOMER STOCK SYNC ERROR:",
      orderNumber,
      stockSyncError
    );
  }
}

res.status(200).send("OK");
  } catch (err) {
    console.error("PAYFAST ITN ERROR:", err);
    res.status(500).send("ITN failed");
  }
});

// ================= ORDER PAYMENT LINK ROUTE =================

app.post("/orders/:id/create-payment-link", async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `
      SELECT *
      FROM public.orders
      WHERE id = $1
      `,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const order = orderResult.rows[0];
    const clearanceGuard = await pool.query(
      'SELECT 1 FROM public.clearance_reservations WHERE order_id = $1 LIMIT 1', [id]
    );
    if (clearanceGuard.rowCount) {
      // Clearance links use the persisted, server-calculated order total.
      // Never use /create-payment (which accepts browser-supplied amounts).
      const clearanceEnabled =
        process.env.CLEARANCE_CHECKOUT_ENABLED === 'true' &&
        process.env.CLEARANCE_PAYMENT_INTEGRATION_VERIFIED === 'true';
      if (!clearanceEnabled) return res.status(503).json({
        success: false, error: 'Clearance PayFast checkout is not enabled yet.'
      });
      if (order.payment_method !== 'PayFast') return res.status(409).json({
        success: false, error: 'This clearance order is not a PayFast order.'
      });
      const reservations = await pool.query(
        `SELECT status, expires_at, (expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP) AS expired
         FROM public.clearance_reservations WHERE order_id = $1`, [id]
      );
      if (!reservations.rows.length ||
          reservations.rows.some(row => row.status !== 'RESERVED' || row.expired || !row.expires_at) ||
          order.payment_status === 'Paid' ||
          order.order_status === 'Cancelled') {
        return res.status(409).json({
          success: false, error: 'This clearance reservation is not awaiting payment.'
        });
      }
    }

    const paymentData = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,

      return_url: `${process.env.APP_URL}/payment-success`,
      cancel_url: `${process.env.APP_URL}/payment-cancelled`,
      notify_url: `${process.env.BACKEND_URL}/payfast-notify`,

      name_first: order.customer_name || "Customer",
      email_address: order.customer_email || "customer@example.com",

      m_payment_id: order.order_number,
      amount: Number(order.total_amount).toFixed(2),
      item_name: `The Snack Merchant Order ${order.order_number}`,
    };

    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    let pfOutput = "";

    for (let key in paymentData) {
      if (paymentData[key] !== "") {
        pfOutput += `${key}=${encodeURIComponent(paymentData[key]).replace(
          /%20/g,
          "+"
        )}&`;
      }
    }

    pfOutput = pfOutput.slice(0, -1);

    if (passphrase !== "") {
      pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(
        /%20/g,
        "+"
      )}`;
    }

    const signature = crypto
      .createHash("md5")
      .update(pfOutput)
      .digest("hex");

    paymentData.signature = signature;

    const queryString = new URLSearchParams(paymentData).toString();
    const paymentUrl = `${process.env.PAYFAST_URL}?${queryString}`;

    res.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: Number(order.total_amount),
      paymentUrl,
    });
  } catch (error) {
    console.error("ORDER PAYMENT LINK ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================= PAYFAST PAYMENT ROUTE =================

app.post("/create-payment", async (req, res) => {
  try {
    const { amount, customerName, customerEmail, orderNumber, itemName, itemDescription } = req.body;
    // The legacy payment endpoint accepts a browser-supplied amount. Do not
    // allow it to generate a clearance payment link.
    const clearanceGuard = await pool.query(`
      SELECT 1 FROM public.orders o
      JOIN public.clearance_reservations r ON r.order_id = o.id
      WHERE o.order_number = $1 LIMIT 1`, [orderNumber || '']);
    if (String(orderNumber || "").startsWith("SM-CL-") || clearanceGuard.rowCount) return res.status(503).json({
      success: false, error: 'Clearance PayFast checkout is not enabled yet.'
    });

    const verifiedOrderResult = await pool.query(
      `SELECT order_number, total_amount, payment_method FROM public.orders WHERE order_number = $1 LIMIT 1`,
      [orderNumber || ""]
    );
    const verifiedOrder = verifiedOrderResult.rows[0];
    if (!verifiedOrder || verifiedOrder.payment_method !== "PayFast" ||
        !Number.isFinite(Number(verifiedOrder.total_amount)) ||
        Number(verifiedOrder.total_amount) <= 0) {
      return res.status(400).json({ success: false, error: "Invalid PayFast order" });
    }

    const paymentData = {
  merchant_id: process.env.PAYFAST_MERCHANT_ID,
  merchant_key: process.env.PAYFAST_MERCHANT_KEY,

   return_url: `${process.env.APP_URL}/payment-success`,
   cancel_url: `${process.env.APP_URL}/payment-cancelled`,
   notify_url: `${process.env.BACKEND_URL}/payfast-notify`,

  name_first: customerName || "Customer",

  email_address:
    customerEmail || "gideonfick@gmail.com",

  m_payment_id: orderNumber,

  amount: Number(verifiedOrder.total_amount).toFixed(2),
  item_name: itemName || itemDescription || "Snack Merchant Order",
};

// ================= SIGNATURE =================
const passphrase = process.env.PAYFAST_PASSPHRASE || "";

let pfOutput = "";

for (let key in paymentData) {
  if (paymentData[key] !== "") {
    pfOutput += `${key}=${encodeURIComponent(
      paymentData[key]
    ).replace(/%20/g, "+")}&`;
  }
}

pfOutput = pfOutput.slice(0, -1);

if (passphrase !== "") {
  pfOutput += `&passphrase=${encodeURIComponent(
    passphrase.trim()
  ).replace(/%20/g, "+")}`;
}

const signature = crypto
  .createHash("md5")
  .update(pfOutput)
  .digest("hex");

paymentData.signature = signature;

    const queryString = new URLSearchParams(paymentData).toString();

    const paymentUrl = `${process.env.PAYFAST_URL}?${queryString}`;
    console.log("PAYFAST URL:", paymentUrl);

    res.json({
      success: true,
      paymentUrl,
    });
  } catch (error) {
    console.error("PAYFAST ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});