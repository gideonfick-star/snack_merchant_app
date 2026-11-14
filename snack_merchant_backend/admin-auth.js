const crypto = require("crypto");
const express = require("express");

const router = express.Router();

const COOKIE_NAME = "tsm_admin_session";
const SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const attempts = new Map();

function configured() {
  return (
    /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(process.env.ADMIN_PIN_HASH || "") &&
    /^[a-f0-9]{64}$/.test(process.env.ADMIN_SESSION_SECRET || "")
  );
}

function cookieOptions(req) {
  const production = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    path: "/",
    maxAge: SESSION_MS
  };
}

function sign(payload) {
  return crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");
}

function verifyPin(pin) {
  const [salt, expectedHex] = process.env.ADMIN_PIN_HASH.split(":");
  const actual = crypto.scryptSync(pin, Buffer.from(salt, "hex"), 64);
  const expected = Buffer.from(expectedHex, "hex");

  return crypto.timingSafeEqual(actual, expected);
}

function verifySession(token) {
  if (!configured() || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;

  if (!/^[a-f0-9]{64}$/.test(signature)) return false;

  const expected = Buffer.from(sign(payload), "hex");
  const supplied = Buffer.from(signature, "hex");

  if (!crypto.timingSafeEqual(expected, supplied)) return false;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    return (
      data.role === "admin" &&
      Number.isSafeInteger(data.exp) &&
      data.exp > Date.now()
    );
  } catch {
    return false;
  }
}

function allowedOrigin(req) {
  const origin = req.get("origin");

  if (!origin) return false;

  const allowed = [
    process.env.APP_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ].filter(Boolean);

  return allowed.includes(origin);
}

router.post("/login", (req, res) => {
  res.set("Cache-Control", "no-store");

  if (!configured()) {
    return res.status(503).json({ error: "Admin login unavailable" });
  }

  if (!allowedOrigin(req)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const pin = req.body?.pin;

  if (typeof pin !== "string" || !/^\d{8,32}$/.test(pin)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const key = req.ip;
  const now = Date.now();
  const record = attempts.get(key);

  if (record && record.until > now && record.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: "Too many attempts" });
  }

  const valid = verifyPin(pin);

  if (!valid) {
    const count =
      record && record.until > now ? record.count + 1 : 1;

    attempts.set(key, {
      count,
      until: now + LOCKOUT_MS
    });

    return res.status(401).json({ error: "Invalid credentials" });
  }

  attempts.delete(key);

  const payload = Buffer.from(
    JSON.stringify({
      role: "admin",
      exp: now + SESSION_MS
    })
  ).toString("base64url");

  res.cookie(
    COOKIE_NAME,
    `${payload}.${sign(payload)}`,
    cookieOptions(req)
  );

  return res.json({ authenticated: true });
});

router.get("/session", (req, res) => {
  res.set("Cache-Control", "no-store");

  return res.json({
    authenticated: verifySession(req.cookies?.[COOKIE_NAME])
  });
});

router.post("/logout", (req, res) => {
  res.set("Cache-Control", "no-store");

  if (!allowedOrigin(req)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const { maxAge, ...options } = cookieOptions(req);
  res.clearCookie(COOKIE_NAME, options);

  return res.json({ authenticated: false });
});


function requireAdminAuth(req, res, next) {
  if (!verifySession(req.cookies?.[COOKIE_NAME])) {
    return res.status(401).json({ error: "Administrator authentication required" });
  }
  const origin = req.get("origin");
  if (origin && !allowedOrigin(req)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  next();
}

module.exports = { router, requireAdminAuth };
