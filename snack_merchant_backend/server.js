require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const crypto = require("crypto");

const app = express();

// ================= DATABASE =================

const pool = new Pool({
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

app.use(cors());
app.use(express.json());

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
      orderType,
      deliveryAddress,
      customerNotes,
      items,
      totalAmount,
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
        order_type,
        delivery_address,
        customer_notes,
        items,
        total_amount,
        payment_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        orderNumber,
        customerName,
        customerPhone,
        orderType,
        deliveryAddress || null,
        customerNotes || null,
        JSON.stringify(items),
        totalAmount,
        paymentMethod,
      ]
    );

    res.json({
      success: true,
      order: result.rows[0],
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

// ================= PAYFAST PAYMENT ROUTE =================

app.post("/create-payment", async (req, res) => {
  try {
    const { amount, customerName, customerEmail } = req.body;

    const paymentData = {
  merchant_id: process.env.PAYFAST_MERCHANT_ID,
  merchant_key: process.env.PAYFAST_MERCHANT_KEY,

   return_url: `${process.env.APP_URL}/payment-success`,
   cancel_url: `${process.env.APP_URL}/payment-cancelled`,
   notify_url: `${process.env.BACKEND_URL}/payfast-notify`,

  name_first: customerName || "Customer",

  email_address:
    customerEmail || "gideonfick@gmail.com",

  m_payment_id: `SM-${Date.now()}`,

  amount: Number(amount).toFixed(2),

  item_name: "Snack Merchant Order",
};

// ================= SIGNATURE =================
const passphrase = "";

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