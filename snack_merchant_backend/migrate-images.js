require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

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

async function migrateImages() {
  const filePath = path.join(__dirname, "product-images-backup.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const images = JSON.parse(raw);

  for (const [productCode, imageUrl] of Object.entries(images)) {
    await pool.query(
      `
      INSERT INTO public.product_images (product_code, image_url, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (product_code)
      DO UPDATE SET
        image_url = EXCLUDED.image_url,
        updated_at = CURRENT_TIMESTAMP
      `,
      [productCode, imageUrl]
    );

    console.log(`Migrated ${productCode}`);
  }

  console.log("Image migration complete.");
  await pool.end();
}

migrateImages().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});