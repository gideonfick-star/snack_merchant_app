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

const app = express();

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

app.post("/upload", upload.single("image"), async (req, res) => {
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

app.post("/product-stock", async (req, res) => {
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

app.post("/product-stock", async (req, res) => {
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

app.post("/product-pricing", async (req, res) => {
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

// ================= LOAD ORDERS =================

app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM public.orders
      ORDER BY created_at DESC
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

app.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, orderStatus } = req.body;

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

    res.json({
      success: true,
      order: result.rows[0],
    });
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);

    res.status(500).json({
      error: "Failed to update order status",
      details: err.message,
    });
  }
});

// ================= CREATE ORDER =================

app.post("/orders", async (req, res) => {
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
    } = req.body;

    if (!customerName || !customerPhone || !orderType || !items || !totalAmount) {
      return res.status(400).json({
        error: "Missing required order fields",
      });
    }

    const orderNumber = `SM-${Date.now()}`;

    const result = await pool.query(
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
        payment_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      ]
    );

    const savedOrder = result.rows[0];

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
    console.error("CREATE ORDER ERROR:", err);

    res.status(500).json({
      error: "Failed to create order",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

// ================= PAYFAST ITN ROUTE =================

app.post("/payfast-notify", async (req, res) => {
  try {
    const itn = req.body;

    console.log("PAYFAST ITN RECEIVED:", itn);

    const orderNumber = itn.m_payment_id;
    const paymentStatus = itn.payment_status;

    if (!orderNumber) {
      return res.status(400).send("Missing m_payment_id");
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

   await pool.query(
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
  `,
  [newPaymentStatus, newOrderStatus, orderNumber]
);

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

  amount: Number(amount).toFixed(2),
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