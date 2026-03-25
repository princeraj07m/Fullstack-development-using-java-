const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 4000;

// MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "@Prince2427",
  database: "inventory_pro",
  waitForConnections: true,
  connectionLimit: 10,
});

// CORS: allow any origin for local dev, and handle preflight explicitly.
app.use(
  cors({
    origin: (origin, callback) => {
      // allow all origins, including file:// (which appears as null)
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"],
    credentials: false,
  }),
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-User-Id",
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("X-Inventory-Pro-Backend", "inventory-pro-backend");
  next();
});

// Simple helper to read user id from header.
function getUserId(req) {
  const raw = req.headers["x-user-id"];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Resolve the effective user id for the request.
// For now, default to user 1 when not provided.
function resolveUserId(req) {
  return getUserId(req) || 1;
}

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function normalizeDateOnly(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value).trim();
  if (!s) return null;
  // Accept YYYY-MM-DD or ISO datetime; store only date portion for DATE columns.
  return s.includes("T") ? s.slice(0, 10) : s;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function normalizeDateTime(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = pad2(value.getUTCMonth() + 1);
    const d = pad2(value.getUTCDate());
    const hh = pad2(value.getUTCHours());
    const mm = pad2(value.getUTCMinutes());
    const ss = pad2(value.getUTCSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (s.includes("T")) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = pad2(d.getUTCMonth() + 1);
    const day = pad2(d.getUTCDate());
    const hh = pad2(d.getUTCHours());
    const mm = pad2(d.getUTCMinutes());
    const ss = pad2(d.getUTCSeconds());
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  }
  return null;
}

function computeStockStatus(quantity, reorderPoint) {
  if (typeof quantity !== "number" || typeof reorderPoint !== "number") return "optimal";
  if (reorderPoint <= 0) return "optimal";
  if (quantity <= Math.max(1, Math.floor(reorderPoint * 0.25))) return "critical";
  if (quantity <= reorderPoint) return "low";
  return "optimal";
}

// Basic login endpoint using the `users` table from your latest schema.
// NOTE: this uses plain-text passwords, matching your SQL seed data.
// For production you should switch to hashed passwords (bcrypt).
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Case-insensitive email match; password checked in SQL.
    const rows = await query(
      `SELECT id, name, email
       FROM users
       WHERE LOWER(email) = LOWER(?) AND password = ?
       LIMIT 1`,
      [email, password],
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    return res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error("Error during login", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

async function getCategoryIdByNameOrCode(category) {
  if (!category) return null;
  const rows = await query(
    `SELECT id FROM categories WHERE name = ? OR code = ? LIMIT 1`,
    [category, category],
  );
  return rows[0]?.id ?? null;
}

async function getSupplierIdByCodeOrName(supplier) {
  if (!supplier) return null;
  const rows = await query(
    `SELECT id FROM suppliers WHERE code = ? OR name = ? LIMIT 1`,
    [supplier, supplier],
  );
  return rows[0]?.id ?? null;
}

async function getCustomerIdByCodeOrName(customer) {
  if (!customer) return null;
  const rows = await query(
    `SELECT id FROM customers WHERE code = ? OR name = ? LIMIT 1`,
    [customer, customer],
  );
  return rows[0]?.id ?? null;
}

async function getProductIdBySkuOrCode(product) {
  if (!product) return null;
  const rows = await query(
    `SELECT id FROM products WHERE sku = ? OR product_code = ? LIMIT 1`,
    [product, product],
  );
  return rows[0]?.id ?? null;
}

async function nextCode(prefix, table, column) {
  const rows = await query(
    `SELECT ${column} AS code FROM ${table} WHERE ${column} LIKE ? ORDER BY ${column} DESC LIMIT 1`,
    [`${prefix}-%`],
  );
  const last = rows[0]?.code;
  const lastNum = last ? Number(String(last).split("-").pop()) : 0;
  const nextNum = Number.isFinite(lastNum) ? lastNum + 1 : 1;
  return `${prefix}-${String(nextNum).padStart(3, "0")}`;
}

async function fetchProductByProductCode(productCode) {
  const rows = await query(
    `
    SELECT
      p.product_code AS id,
      p.sku,
      p.name,
      c.name AS category,
      s.code AS supplier,
      p.quantity,
      p.reorder_point AS reorderPoint,
      p.unit_price AS price,
      p.location,
      p.status,
      DATE_FORMAT(p.last_restocked, '%Y-%m-%d') AS lastRestocked
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.product_code = ?
    LIMIT 1
  `,
    [productCode],
  );
  return rows[0] ?? null;
}

// Products
app.get("/api/products", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const rows = await query(
      `
      SELECT
        p.product_code AS id,
        p.sku,
        p.name,
        c.name AS category,
        s.code AS supplier,
        p.quantity,
        p.reorder_point AS reorderPoint,
        p.unit_price AS price,
        p.location,
        p.status,
        DATE_FORMAT(p.last_restocked, '%Y-%m-%d') AS lastRestocked
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.user_id = ?
      ORDER BY p.sku
    `,
      [userId],
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching products", err);
    res.status(500).json({ error: "Failed to fetch products" });
  } 
}); 

app.get("/api/products/:productCode", async (req, res) => {
  try {
    const product = await fetchProductByProductCode(req.params.productCode);
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    console.error("Error fetching product", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const userId = getUserId(req) || 1;
    const {
      sku,
      name,
      category,
      quantity = 0,
      reorderPoint = 0,
      price = 0,
      location = null,
      supplier = null,
      lastRestocked = null,
      status = null,
    } = req.body || {};

    if (!name || !category) {
      return res.status(400).json({ error: "Missing required fields: name, category" });
    }

    const categoryId = await getCategoryIdByNameOrCode(category);
    if (!categoryId) return res.status(400).json({ error: "Invalid category" });

    const supplierId = await getSupplierIdByCodeOrName(supplier);
    const productCode = await nextCode("PRD", "products", "product_code");
    const finalSku = sku && String(sku).trim() ? String(sku).trim() : await nextCode("SKU", "products", "sku");

    const q = Number(quantity);
    const rp = Number(reorderPoint);
    const unitPrice = Number(price);
    const computedStatus = status || computeStockStatus(q, rp);
    const restockedDate = normalizeDateOnly(lastRestocked);

    await query(
      `
      INSERT INTO products
        (user_id, product_code, sku, name, category_id, supplier_id, quantity, reorder_point, unit_price, location, status, last_restocked)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        productCode,
        finalSku,
        name,
        categoryId,
        supplierId,
        q,
        rp,
        unitPrice,
        location,
        computedStatus,
        restockedDate,
      ],
    );

    const product = await fetchProductByProductCode(productCode);
    return res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.put("/api/products/:productCode", async (req, res) => {
  try {
    const productCode = req.params.productCode;
    const existingRows = await query(`SELECT id FROM products WHERE product_code = ? LIMIT 1`, [productCode]);
    if (!existingRows.length) return res.status(404).json({ error: "Product not found" });

    const {
      sku,
      name,
      category,
      quantity,
      reorderPoint,
      price,
      location,
      supplier,
      lastRestocked,
      status,
    } = req.body || {};

    const updates = [];
    const params = [];

    if (sku !== undefined) { updates.push("sku = ?"); params.push(sku); }
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (location !== undefined) { updates.push("location = ?"); params.push(location); }
    if (lastRestocked !== undefined) {
      updates.push("last_restocked = ?");
      params.push(normalizeDateOnly(lastRestocked));
    }

    if (quantity !== undefined) { updates.push("quantity = ?"); params.push(Number(quantity)); }
    if (reorderPoint !== undefined) { updates.push("reorder_point = ?"); params.push(Number(reorderPoint)); }
    if (price !== undefined) { updates.push("unit_price = ?"); params.push(Number(price)); }

    if (category !== undefined) {
      const categoryId = await getCategoryIdByNameOrCode(category);
      if (!categoryId) return res.status(400).json({ error: "Invalid category" });
      updates.push("category_id = ?");
      params.push(categoryId);
    }

    if (supplier !== undefined) {
      const supplierId = await getSupplierIdByCodeOrName(supplier);
      updates.push("supplier_id = ?");
      params.push(supplierId);
    }

    // status can be explicitly set, otherwise compute if quantity/reorder changed
    if (status !== undefined && status !== null) {
      updates.push("status = ?");
      params.push(status);
    } else if (quantity !== undefined || reorderPoint !== undefined) {
      const cur = await query(`SELECT quantity, reorder_point FROM products WHERE product_code = ? LIMIT 1`, [productCode]);
      const q = quantity !== undefined ? Number(quantity) : Number(cur[0].quantity);
      const rp = reorderPoint !== undefined ? Number(reorderPoint) : Number(cur[0].reorder_point);
      updates.push("status = ?");
      params.push(computeStockStatus(q, rp));
    }

    if (!updates.length) return res.status(400).json({ error: "No fields to update" });

    params.push(productCode);
    await query(`UPDATE products SET ${updates.join(", ")} WHERE product_code = ?`, params);

    const product = await fetchProductByProductCode(productCode);
    return res.json(product);
  } catch (err) {
    console.error("Error updating product", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:productCode", async (req, res) => {
  try {
    const productCode = req.params.productCode;
    const rows = await query(`SELECT id FROM products WHERE product_code = ? LIMIT 1`, [productCode]);
    if (!rows.length) return res.status(404).json({ error: "Product not found" });

    const productId = rows[0].id;

    // Remove dependent records first (FK safe)
    await query(`DELETE FROM inventory_alerts WHERE product_id = ?`, [productId]);
    await query(`DELETE FROM inventory_transactions WHERE product_id = ?`, [productId]);
    await query(`DELETE FROM products WHERE id = ?`, [productId]);

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting product", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

async function fetchTransactionByCode(code) {
  const rows = await query(
    `
    SELECT
      t.transaction_code AS id,
      DATE_FORMAT(t.occurred_at, '%Y-%m-%d %H:%i:%s') AS date,
      t.reference,
      t.type,
      p.name AS product,
      p.sku,
      t.quantity,
      t.unit_price AS unitPrice,
      t.total_value AS total,
      t.user_name AS user,
      t.notes
    FROM inventory_transactions t
    JOIN products p ON t.product_id = p.id
    WHERE t.transaction_code = ?
    LIMIT 1
  `,
    [code],
  );
  return rows[0] ?? null;
}

// Transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const rows = await query(
      `
      SELECT
        t.transaction_code AS id,
        DATE_FORMAT(t.occurred_at, '%Y-%m-%d %H:%i:%s') AS date,
        t.reference,
        t.type,
        p.name AS product,
        p.sku,
        t.quantity,
        t.unit_price AS unitPrice,
        t.total_value AS total,
        t.user_name AS user,
        t.notes
      FROM inventory_transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.user_id = ?
      ORDER BY t.occurred_at DESC
    `
    , [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching transactions", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.get("/api/transactions/:transactionCode", async (req, res) => {
  try {
    const txn = await fetchTransactionByCode(req.params.transactionCode);
    if (!txn) return res.status(404).json({ error: "Transaction not found" });
    return res.json(txn);
  } catch (err) {
    console.error("Error fetching transaction", err);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const {
      occurredAt,
      reference,
      type,
      productSku,
      customerCode = null,
      supplierCode = null,
      quantity,
      unitPrice,
      user = null,
      notes = null,
    } = req.body || {};

    if (!reference || !type || !productSku) {
      return res
        .status(400)
        .json({ error: "Missing required fields: reference, type, productSku" });
    }
    if (!["in", "out", "adjustment"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const productId = await getProductIdBySkuOrCode(productSku);
    if (!productId) return res.status(400).json({ error: "Invalid productSku" });

    const customerId = await getCustomerIdByCodeOrName(customerCode);
    const supplierId = await getSupplierIdByCodeOrName(supplierCode);

    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) {
      return res.status(400).json({ error: "Invalid quantity/unitPrice" });
    }

    const occurred = normalizeDateTime(occurredAt) || normalizeDateTime(new Date());
    const total = Math.round(qty * price * 100) / 100;
    const txnCode = await nextCode("TXN", "inventory_transactions", "transaction_code");

    await query(
      `
      INSERT INTO inventory_transactions
        (user_id, transaction_code, occurred_at, reference, type, product_id, customer_id, supplier_id, quantity, unit_price, total_value, user_name, notes)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [userId, txnCode, occurred, reference, type, productId, customerId, supplierId, qty, price, total, user, notes],
    );

    const txn = await fetchTransactionByCode(txnCode);
    return res.status(201).json(txn);
  } catch (err) {
    console.error("Error creating transaction", err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.put("/api/transactions/:transactionCode", async (req, res) => {
  try {
    const txnCode = req.params.transactionCode;
    const existing = await query(
      `SELECT id FROM inventory_transactions WHERE transaction_code = ? LIMIT 1`,
      [txnCode],
    );
    if (!existing.length) return res.status(404).json({ error: "Transaction not found" });

    const {
      occurredAt,
      reference,
      type,
      productSku,
      customerCode,
      supplierCode,
      quantity,
      unitPrice,
      user,
      notes,
    } = req.body || {};

    const updates = [];
    const params = [];

    if (occurredAt !== undefined) {
      updates.push("occurred_at = ?");
      params.push(normalizeDateTime(occurredAt));
    }
    if (reference !== undefined) { updates.push("reference = ?"); params.push(reference); }
    if (type !== undefined) {
      if (!["in", "out", "adjustment"].includes(type)) return res.status(400).json({ error: "Invalid type" });
      updates.push("type = ?"); params.push(type);
    }

    if (productSku !== undefined) {
      const productId = await getProductIdBySkuOrCode(productSku);
      if (!productId) return res.status(400).json({ error: "Invalid productSku" });
      updates.push("product_id = ?");
      params.push(productId);
    }

    if (customerCode !== undefined) {
      const customerId = await getCustomerIdByCodeOrName(customerCode);
      updates.push("customer_id = ?");
      params.push(customerId);
    }

    if (supplierCode !== undefined) {
      const supplierId = await getSupplierIdByCodeOrName(supplierCode);
      updates.push("supplier_id = ?");
      params.push(supplierId);
    }

    if (quantity !== undefined) { updates.push("quantity = ?"); params.push(Number(quantity)); }
    if (unitPrice !== undefined) { updates.push("unit_price = ?"); params.push(Number(unitPrice)); }
    if (user !== undefined) { updates.push("user_name = ?"); params.push(user); }
    if (notes !== undefined) { updates.push("notes = ?"); params.push(notes); }

    // Recompute total if quantity or unit price changed (or set explicitly later if needed)
    if (quantity !== undefined || unitPrice !== undefined) {
      const cur = await query(
        `SELECT quantity, unit_price FROM inventory_transactions WHERE transaction_code = ? LIMIT 1`,
        [txnCode],
      );
      const qty = quantity !== undefined ? Number(quantity) : Number(cur[0].quantity);
      const price = unitPrice !== undefined ? Number(unitPrice) : Number(cur[0].unit_price);
      updates.push("total_value = ?");
      params.push(Math.round(qty * price * 100) / 100);
    }

    if (!updates.length) return res.status(400).json({ error: "No fields to update" });

    params.push(txnCode);
    await query(`UPDATE inventory_transactions SET ${updates.join(", ")} WHERE transaction_code = ?`, params);

    const txn = await fetchTransactionByCode(txnCode);
    return res.json(txn);
  } catch (err) {
    console.error("Error updating transaction", err);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

app.delete("/api/transactions/:transactionCode", async (req, res) => {
  try {
    const txnCode = req.params.transactionCode;
    const existing = await query(
      `SELECT id FROM inventory_transactions WHERE transaction_code = ? LIMIT 1`,
      [txnCode],
    );
    if (!existing.length) return res.status(404).json({ error: "Transaction not found" });

    await query(`DELETE FROM inventory_transactions WHERE transaction_code = ?`, [txnCode]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting transaction", err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// Alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const rows = await query(
      `
      SELECT
        a.alert_code AS id,
        a.type,
        p.name AS product,
        p.sku,
        a.current_stock AS current,
        a.threshold,
        a.message,
        DATE_FORMAT(a.alert_at, '%Y-%m-%d %H:%i:%s') AS date,
        a.status
      FROM inventory_alerts a
      JOIN products p ON a.product_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.alert_at DESC
    `
    , [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching alerts", err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

async function fetchAlertByCode(alertCode) {
  const rows = await query(
    `
    SELECT
      a.alert_code AS id,
      a.type,
      p.name AS product,
      p.sku,
      a.current_stock AS current,
      a.threshold,
      a.message,
      DATE_FORMAT(a.alert_at, '%Y-%m-%d %H:%i:%s') AS date,
      a.status
    FROM inventory_alerts a
    JOIN products p ON a.product_id = p.id
    WHERE a.alert_code = ?
    LIMIT 1
  `,
    [alertCode],
  );
  return rows[0] ?? null;
}

app.get("/api/alerts/:alertCode", async (req, res) => {
  try {
    const alert = await fetchAlertByCode(req.params.alertCode);
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json(alert);
  } catch (err) {
    console.error("Error fetching alert", err);
    res.status(500).json({ error: "Failed to fetch alert" });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const {
      type,
      status = "active",
      productSku,
      current = 0,
      threshold = 0,
      message,
      alertAt,
    } = req.body || {};

    if (!type || !productSku || !message) {
      return res.status(400).json({ error: "Missing required fields: type, productSku, message" });
    }
    if (!["critical", "warning", "info"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }
    if (!["active", "acknowledged", "resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const productId = await getProductIdBySkuOrCode(productSku);
    if (!productId) return res.status(400).json({ error: "Invalid productSku" });

    const alertCode = await nextCode("ALR", "inventory_alerts", "alert_code");
    const when = normalizeDateTime(alertAt) || normalizeDateTime(new Date());

    await query(
      `
      INSERT INTO inventory_alerts
        (user_id, alert_code, type, product_id, current_stock, threshold, message, alert_at, status)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [userId, alertCode, type, productId, Number(current), Number(threshold), message, when, status],
    );

    const created = await fetchAlertByCode(alertCode);
    return res.status(201).json(created);
  } catch (err) {
    console.error("Error creating alert", err);
    res.status(500).json({ error: "Failed to create alert" });
  }
});

app.put("/api/alerts/:alertCode", async (req, res) => {
  try {
    const alertCode = req.params.alertCode;
    const existing = await query(
      `SELECT id FROM inventory_alerts WHERE alert_code = ? LIMIT 1`,
      [alertCode],
    );
    if (!existing.length) return res.status(404).json({ error: "Alert not found" });

    const { type, status, productSku, current, threshold, message, alertAt } = req.body || {};

    const updates = [];
    const params = [];

    if (type !== undefined) {
      if (!["critical", "warning", "info"].includes(type)) return res.status(400).json({ error: "Invalid type" });
      updates.push("type = ?");
      params.push(type);
    }
    if (status !== undefined) {
      if (!["active", "acknowledged", "resolved"].includes(status)) return res.status(400).json({ error: "Invalid status" });
      updates.push("status = ?");
      params.push(status);
    }
    if (productSku !== undefined) {
      const productId = await getProductIdBySkuOrCode(productSku);
      if (!productId) return res.status(400).json({ error: "Invalid productSku" });
      updates.push("product_id = ?");
      params.push(productId);
    }
    if (current !== undefined) { updates.push("current_stock = ?"); params.push(Number(current)); }
    if (threshold !== undefined) { updates.push("threshold = ?"); params.push(Number(threshold)); }
    if (message !== undefined) { updates.push("message = ?"); params.push(message); }
    if (alertAt !== undefined) { updates.push("alert_at = ?"); params.push(normalizeDateTime(alertAt)); }

    if (!updates.length) return res.status(400).json({ error: "No fields to update" });

    params.push(alertCode);
    await query(`UPDATE inventory_alerts SET ${updates.join(", ")} WHERE alert_code = ?`, params);

    const updated = await fetchAlertByCode(alertCode);
    return res.json(updated);
  } catch (err) {
    console.error("Error updating alert", err);
    res.status(500).json({ error: "Failed to update alert" });
  }
});

app.delete("/api/alerts/:alertCode", async (req, res) => {
  try {
    const alertCode = req.params.alertCode;
    const existing = await query(
      `SELECT id FROM inventory_alerts WHERE alert_code = ? LIMIT 1`,
      [alertCode],
    );
    if (!existing.length) return res.status(404).json({ error: "Alert not found" });

    await query(`DELETE FROM inventory_alerts WHERE alert_code = ?`, [alertCode]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting alert", err);
    res.status(500).json({ error: "Failed to delete alert" });
  }
});

// Categories with aggregate stats
app.get("/api/categories", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const rows = await query(
      `
      SELECT
        c.id,
        c.code,
        c.name,
        c.description,
        c.status,
        c.subcategories,
        DATE_FORMAT(c.last_modified, '%Y-%m-%d') AS lastModified,
        COUNT(p.id) AS itemCount,
        COALESCE(SUM(p.quantity * p.unit_price), 0) AS totalValue
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.code
    `
    , [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching categories", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

function normalizeCsv(value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    const cleaned = value.map((v) => String(v).trim()).filter(Boolean);
    return cleaned.length ? cleaned.join(",") : null;
  }
  const s = String(value).trim();
  if (!s) return null;
  const cleaned = s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return cleaned.length ? cleaned.join(",") : null;
}

async function ensureUncategorizedCategoryId() {
  const existing = await query(`SELECT id FROM categories WHERE code = 'CAT-000' LIMIT 1`);
  if (existing.length) return existing[0].id;
  await query(
    `
    INSERT INTO categories (code, name, description, subcategories, status, last_modified)
    VALUES ('CAT-000', 'Uncategorized', 'Default category for unassigned products', NULL, 'active', ?)
  `,
    [normalizeDateOnly(new Date())],
  );
  const created = await query(`SELECT id FROM categories WHERE code = 'CAT-000' LIMIT 1`);
  return created[0].id;
}

async function fetchCategoryById(id) {
  const rows = await query(
    `
    SELECT
      c.id,
      c.code,
      c.name,
      c.description,
      c.status,
      c.subcategories,
      DATE_FORMAT(c.last_modified, '%Y-%m-%d') AS lastModified,
      COUNT(p.id) AS itemCount,
      COALESCE(SUM(p.quantity * p.unit_price), 0) AS totalValue
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
    LIMIT 1
  `,
    [id],
  );
  return rows[0] ?? null;
}

app.get("/api/categories/:id", async (req, res) => {
  try {
    const category = await fetchCategoryById(Number(req.params.id));
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error("Error fetching category", err);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { code, name, description = null, subcategories = null, status = "active", lastModified = null } = req.body || {};
    if (!name) return res.status(400).json({ error: "Missing required field: name" });
    if (!["active", "inactive"].includes(status)) return res.status(400).json({ error: "Invalid status" });

    const finalCode =
      code && String(code).trim()
        ? String(code).trim()
        : await nextCode("CAT", "categories", "code");

    const lm = normalizeDateOnly(lastModified) || normalizeDateOnly(new Date());
    const sub = normalizeCsv(subcategories);

    await query(
      `
      INSERT INTO categories (user_id, code, name, description, subcategories, status, last_modified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [userId, finalCode, name, description, sub, status, lm],
    );

    const created = await query(`SELECT id FROM categories WHERE code = ? LIMIT 1`, [finalCode]);
    const category = await fetchCategoryById(created[0].id);
    return res.status(201).json(category);
  } catch (err) {
    console.error("Error creating category", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const existing = await query(`SELECT code FROM categories WHERE id = ? LIMIT 1`, [categoryId]);
    if (!existing.length) return res.status(404).json({ error: "Category not found" });
    if (existing[0].code === "CAT-000") return res.status(400).json({ error: "Uncategorized category cannot be edited" });

    const { code, name, description, subcategories, status, lastModified } = req.body || {};

    const updates = [];
    const params = [];

    if (code !== undefined) { updates.push("code = ?"); params.push(code); }
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (subcategories !== undefined) { updates.push("subcategories = ?"); params.push(normalizeCsv(subcategories)); }
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) return res.status(400).json({ error: "Invalid status" });
      updates.push("status = ?");
      params.push(status);
    }
    // always bump last_modified unless explicitly provided
    updates.push("last_modified = ?");
    params.push(normalizeDateOnly(lastModified) || normalizeDateOnly(new Date()));

    if (!updates.length) return res.status(400).json({ error: "No fields to update" });

    params.push(categoryId);
    await query(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`, params);

    const category = await fetchCategoryById(categoryId);
    return res.json(category);
  } catch (err) {
    console.error("Error updating category", err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const existing = await query(`SELECT code FROM categories WHERE id = ? LIMIT 1`, [categoryId]);
    if (!existing.length) return res.status(404).json({ error: "Category not found" });
    if (existing[0].code === "CAT-000") return res.status(400).json({ error: "Uncategorized category cannot be deleted" });

    const uncategorizedId = await ensureUncategorizedCategoryId();
    await query(`UPDATE products SET category_id = ? WHERE category_id = ?`, [uncategorizedId, categoryId]);
    await query(`DELETE FROM categories WHERE id = ?`, [categoryId]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting category", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Suppliers
app.get("/api/suppliers", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const rows = await query(
      `
      SELECT
        id,
        code,
        name,
        contact_name AS contactName,
        email,
        phone,
        location,
        lead_time_days AS leadTimeDays,
        on_time_rate AS onTimeRate,
        rating,
        status,
        payment_terms AS paymentTerms,
        DATE_FORMAT(last_order_date, '%Y-%m-%d') AS lastOrderDate,
        total_spend AS totalSpend
      FROM suppliers
      WHERE user_id = ?
      ORDER BY code
    `,
      [userId],
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching suppliers", err);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

async function fetchSupplierById(id) {
  const rows = await query(
    `
    SELECT
      id,
      code,
      name,
      contact_name AS contactName,
      email,
      phone,
      location,
      lead_time_days AS leadTimeDays,
      on_time_rate AS onTimeRate,
      rating,
      status,
      payment_terms AS paymentTerms,
      DATE_FORMAT(last_order_date, '%Y-%m-%d') AS lastOrderDate,
      total_spend AS totalSpend
    FROM suppliers
    WHERE id = ?
    LIMIT 1
  `,
    [id],
  );
  return rows[0] ?? null;
}

app.get("/api/suppliers/:id", async (req, res) => {
  try {
    const supplier = await fetchSupplierById(Number(req.params.id));
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    console.error("Error fetching supplier", err);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

app.post("/api/suppliers", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const {
      code,
      name,
      contactName = null,
      email = null,
      phone = null,
      location = null,
      leadTimeDays = null,
      onTimeRate = null,
      rating = null,
      status = "active",
      paymentTerms = null,
      lastOrderDate = null,
      totalSpend = 0,
    } = req.body || {};

    if (!name) return res.status(400).json({ error: "Missing required field: name" });

    const finalCode = code && String(code).trim() ? String(code).trim() : await nextCode("SUP", "suppliers", "code");
    const lastDate = normalizeDateOnly(lastOrderDate);

    await query(
      `
      INSERT INTO suppliers
        (user_id, code, name, contact_name, email, phone, location, lead_time_days, on_time_rate, rating, status, payment_terms, last_order_date, total_spend)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        finalCode,
        name,
        contactName,
        email,
        phone,
        location,
        leadTimeDays !== null ? Number(leadTimeDays) : null,
        onTimeRate !== null ? Number(onTimeRate) : null,
        rating !== null ? Number(rating) : null,
        status,
        paymentTerms,
        lastDate,
        Number(totalSpend),
      ],
    );

    const created = await query(`SELECT LAST_INSERT_ID() AS id`);
    const supplier = await fetchSupplierById(created[0].id);
    return res.status(201).json(supplier);
  } catch (err) {
    console.error("Error creating supplier", err);
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

app.put("/api/suppliers/:id", async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const existing = await query(`SELECT id FROM suppliers WHERE id = ? LIMIT 1`, [supplierId]);
    if (!existing.length) return res.status(404).json({ error: "Supplier not found" });

    const {
      code,
      name,
      contactName,
      email,
      phone,
      location,
      leadTimeDays,
      onTimeRate,
      rating,
      status,
      paymentTerms,
      lastOrderDate,
      totalSpend,
    } = req.body || {};

    const updates = [];
    const params = [];

    if (code !== undefined) { updates.push("code = ?"); params.push(code); }
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (contactName !== undefined) { updates.push("contact_name = ?"); params.push(contactName); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
    if (location !== undefined) { updates.push("location = ?"); params.push(location); }
    if (leadTimeDays !== undefined) { updates.push("lead_time_days = ?"); params.push(leadTimeDays === null ? null : Number(leadTimeDays)); }
    if (onTimeRate !== undefined) { updates.push("on_time_rate = ?"); params.push(onTimeRate === null ? null : Number(onTimeRate)); }
    if (rating !== undefined) { updates.push("rating = ?"); params.push(rating === null ? null : Number(rating)); }
    if (status !== undefined) { updates.push("status = ?"); params.push(status); }
    if (paymentTerms !== undefined) { updates.push("payment_terms = ?"); params.push(paymentTerms); }
    if (lastOrderDate !== undefined) { updates.push("last_order_date = ?"); params.push(normalizeDateOnly(lastOrderDate)); }
    if (totalSpend !== undefined) { updates.push("total_spend = ?"); params.push(Number(totalSpend)); }

    if (!updates.length) return res.status(400).json({ error: "No fields to update" });

    params.push(supplierId);
    await query(`UPDATE suppliers SET ${updates.join(", ")} WHERE id = ?`, params);

    const supplier = await fetchSupplierById(supplierId);
    return res.json(supplier);
  } catch (err) {
    console.error("Error updating supplier", err);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

app.delete("/api/suppliers/:id", async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const existing = await query(`SELECT id FROM suppliers WHERE id = ? LIMIT 1`, [supplierId]);
    if (!existing.length) return res.status(404).json({ error: "Supplier not found" });

    // Unlink references (FK safe)
    await query(`UPDATE products SET supplier_id = NULL WHERE supplier_id = ?`, [supplierId]);
    await query(`UPDATE inventory_transactions SET supplier_id = NULL WHERE supplier_id = ?`, [supplierId]);
    await query(`DELETE FROM suppliers WHERE id = ?`, [supplierId]);

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting supplier", err);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

// Customers
app.get("/api/customers", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const rows = await query(
      `
      SELECT
        id,
        code,
        name,
        type,
        contact_name AS contactName,
        email,
        phone,
        location,
        total_orders AS totalOrders,
        total_revenue AS totalRevenue,
        DATE_FORMAT(last_order_date, '%Y-%m-%d') AS lastOrderDate,
        status,
        credit_limit AS creditLimit,
        balance
      FROM customers
      WHERE user_id = ?
      ORDER BY code
    `,
      [userId],
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching customers", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

async function fetchCustomerById(id) {
  const rows = await query(
    `
    SELECT
      id,
      code,
      name,
      type,
      contact_name AS contactName,
      email,
      phone,
      location,
      total_orders AS totalOrders,
      total_revenue AS totalRevenue,
      DATE_FORMAT(last_order_date, '%Y-%m-%d') AS lastOrderDate,
      status,
      credit_limit AS creditLimit,
      balance
    FROM customers
    WHERE id = ?
    LIMIT 1
  `,
    [id],
  );
  return rows[0] ?? null;
}

app.get("/api/customers/:id", async (req, res) => {
  try {
    const customer = await fetchCustomerById(Number(req.params.id));
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    console.error("Error fetching customer", err);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const {
      code,
      name,
      type = "B2B",
      contactName = null,
      email = null,
      phone = null,
      location = null,
      totalOrders = 0,
      totalRevenue = 0,
      lastOrderDate = null,
      status = "active",
      creditLimit = 0,
      balance = 0,
    } = req.body || {};

    if (!name) return res.status(400).json({ error: "Missing required field: name" });

    const finalCode =
      code && String(code).trim()
        ? String(code).trim()
        : await nextCode("CUST", "customers", "code");

    await query(
      `
      INSERT INTO customers
        (user_id, code, name, type, contact_name, email, phone, location, total_orders, total_revenue, last_order_date, status, credit_limit, balance)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        finalCode,
        name,
        type,
        contactName,
        email,
        phone,
        location,
        Number(totalOrders),
        Number(totalRevenue),
        normalizeDateOnly(lastOrderDate),
        status,
        Number(creditLimit),
        Number(balance),
      ],
    );

    const created = await query(`SELECT LAST_INSERT_ID() AS id`);
    const customer = await fetchCustomerById(created[0].id);
    return res.status(201).json(customer);
  } catch (err) {
    console.error("Error creating customer", err);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const existing = await query(`SELECT id FROM customers WHERE id = ? LIMIT 1`, [customerId]);
    if (!existing.length) return res.status(404).json({ error: "Customer not found" });

    const {
      code,
      name,
      type,
      contactName,
      email,
      phone,
      location,
      totalOrders,
      totalRevenue,
      lastOrderDate,
      status,
      creditLimit,
      balance,
    } = req.body || {};

    const updates = [];
    const params = [];

    if (code !== undefined) { updates.push("code = ?"); params.push(code); }
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (type !== undefined) { updates.push("type = ?"); params.push(type); }
    if (contactName !== undefined) { updates.push("contact_name = ?"); params.push(contactName); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
    if (location !== undefined) { updates.push("location = ?"); params.push(location); }
    if (totalOrders !== undefined) { updates.push("total_orders = ?"); params.push(Number(totalOrders)); }
    if (totalRevenue !== undefined) { updates.push("total_revenue = ?"); params.push(Number(totalRevenue)); }
    if (lastOrderDate !== undefined) { updates.push("last_order_date = ?"); params.push(normalizeDateOnly(lastOrderDate)); }
    if (status !== undefined) { updates.push("status = ?"); params.push(status); }
    if (creditLimit !== undefined) { updates.push("credit_limit = ?"); params.push(Number(creditLimit)); }
    if (balance !== undefined) { updates.push("balance = ?"); params.push(Number(balance)); }

    if (!updates.length) return res.status(400).json({ error: "No fields to update" });

    params.push(customerId);
    await query(`UPDATE customers SET ${updates.join(", ")} WHERE id = ?`, params);

    const customer = await fetchCustomerById(customerId);
    return res.json(customer);
  } catch (err) {
    console.error("Error updating customer", err);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const existing = await query(`SELECT id FROM customers WHERE id = ? LIMIT 1`, [customerId]);
    if (!existing.length) return res.status(404).json({ error: "Customer not found" });

    // Unlink references (FK safe)
    await query(`UPDATE inventory_transactions SET customer_id = NULL WHERE customer_id = ?`, [customerId]);
    await query(`DELETE FROM customers WHERE id = ?`, [customerId]);

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting customer", err);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// Simple health check
app.get("/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error" });
  }
});

app.get("/api/version", (req, res) => {
  res.json({
    name: "inventory-pro-backend",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Inventory Pro backend listening on http://localhost:${PORT}`);
});

