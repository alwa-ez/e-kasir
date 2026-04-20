require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const schemaPath = path.join(__dirname, "db", "schema.sql");
const publicPath = path.join(__dirname, "public");
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/e_kasir";
const useSsl = connectionString.includes("sslmode=require") || connectionString.includes("supabase.com");

const pool = new Pool({
  connectionString,
  ssl: useSsl
    ? {
        rejectUnauthorized: false
      }
    : false
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);
app.use(express.static(publicPath));

function parseInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function badRequest(res, message) {
  return res.status(400).json({ message });
}

function serverError(res, message, error) {
  return res.status(500).json({
    message,
    detail: error?.message || "Database error."
  });
}

async function initializeDatabase() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL database.");
    const schema = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schema);
    console.log("Database schema initialized.");
  } catch (error) {
    console.error("Failed to initialize database:", error.message || error);
    process.exit(1);
  }
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
}

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = String(username || "").trim();

  if (!normalizedUsername || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [normalizedUsername, hashedPassword]
    );
    return res.status(201).json({
      message: "Register berhasil.",
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Username sudah digunakan." });
    }
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = String(username || "").trim();

  if (!normalizedUsername || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi." });
  }

  try {
    const result = await pool.query("SELECT id, username, password FROM users WHERE username = $1", [
      normalizedUsername
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Username atau password salah." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Username atau password salah." });
    }

    req.session.user = {
      id: user.id,
      username: user.username
    };

    return res.json({
      message: "Login berhasil.",
      user: req.session.user
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal melakukan login." });
  }
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false });
  }
  return res.json({ loggedIn: true, user: req.session.user });
});

app.get("/api/products", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, price, stock FROM products ORDER BY name ASC");
    return res.json({ products: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil produk." });
  }
});

app.post("/api/products", requireAuth, async (req, res) => {
  const { name, price, stock } = req.body;
  const normalizedName = String(name || "").trim();
  const parsedPrice = parseNumber(price);
  const parsedStock = parseInteger(stock);

  if (!normalizedName) {
    return badRequest(res, "Nama produk wajib diisi.");
  }

  if (parsedPrice === null || parsedPrice < 0) {
    return badRequest(res, "Harga produk tidak valid.");
  }

  if (parsedStock === null || parsedStock < 0) {
    return badRequest(res, "Stok produk tidak valid.");
  }

  try {
    const existingProductResult = await pool.query(
      "SELECT id, name, price, stock FROM products WHERE LOWER(name) = LOWER($1) LIMIT 1",
      [normalizedName]
    );

    if (existingProductResult.rows.length > 0) {
      const existingProduct = existingProductResult.rows[0];
      const updatedResult = await pool.query(
        "UPDATE products SET stock = stock + $1, price = $2 WHERE id = $3 RETURNING id, name, price, stock",
        [parsedStock, parsedPrice, existingProduct.id]
      );

      return res.json({
        message: `Stok produk ${existingProduct.name} berhasil ditambahkan.`,
        product: updatedResult.rows[0]
      });
    }

    const insertedResult = await pool.query(
      "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING id, name, price, stock",
      [normalizedName, parsedPrice, parsedStock]
    );
    return res.status(201).json({
      message: "Produk berhasil ditambahkan.",
      product: insertedResult.rows[0]
    });
  } catch (error) {
    return serverError(res, "Gagal menambahkan produk.", error);
  }
});

app.patch("/api/products/:id/stock", requireAuth, async (req, res) => {
  const productId = parseInteger(req.params.id);
  const stockToAdd = parseInteger(req.body.stockToAdd);

  if (productId === null || productId <= 0) {
    return badRequest(res, "ID produk tidak valid.");
  }

  if (stockToAdd === null || stockToAdd <= 0) {
    return badRequest(res, "Jumlah stok tambahan harus bilangan bulat lebih dari 0.");
  }

  try {
    const result = await pool.query(
      "UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING id, name, price, stock",
      [stockToAdd, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan." });
    }

    return res.json({
      message: `Stok produk ${result.rows[0].name} berhasil ditambahkan.`,
      product: result.rows[0]
    });
  } catch (error) {
    return serverError(res, "Gagal menambahkan stok produk.", error);
  }
});

app.post("/api/checkout", requireAuth, async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Keranjang belanja kosong." });
  }

  const groupedItems = new Map();
  for (const item of items) {
    const id = parseInteger(item.id);
    const qty = parseInteger(item.qty);
    if (id === null || qty === null || qty <= 0) {
      return badRequest(res, "Data keranjang tidak valid.");
    }
    groupedItems.set(id, (groupedItems.get(id) || 0) + qty);
  }

  const normalizedItems = Array.from(groupedItems.entries()).map(([id, qty]) => ({ id, qty }));
  const ids = normalizedItems.map((item) => item.id);
  const client = await pool.connect();

  try {
    const productResult = await client.query(
      "SELECT id, name, price, stock FROM products WHERE id = ANY($1::int[])",
      [ids]
    );
    const productMap = new Map(productResult.rows.map((product) => [Number(product.id), product]));
    let totalPrice = 0;
    const saleItems = [];

    for (const item of normalizedItems) {
      const product = productMap.get(item.id);
      if (!product) {
        return res.status(400).json({ message: `Produk dengan id ${item.id} tidak ditemukan.` });
      }
      if (Number(product.stock) < item.qty) {
        return res
          .status(400)
          .json({ message: `Stok ${product.name} tidak cukup. Sisa stok: ${product.stock}.` });
      }
      const price = Number(product.price);
      const subtotal = price * item.qty;
      totalPrice += subtotal;
      saleItems.push({
        id: item.id,
        name: product.name,
        price,
        qty: item.qty,
        subtotal
      });
    }

    await client.query("BEGIN");
    for (const item of normalizedItems) {
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.qty, item.id]);
    }
    await client.query("INSERT INTO sales (total_price, items) VALUES ($1, $2::jsonb)", [
      totalPrice,
      JSON.stringify(saleItems)
    ]);

    await client.query("COMMIT");
    return res.json({ message: "Check out berhasil.", totalPrice });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {}
    return res.status(500).json({ message: "Gagal memproses checkout." });
  } finally {
    client.release();
  }
});

app.get("/api/reports", requireAuth, async (req, res) => {
  const period = String(req.query.period || "daily").toLowerCase();
  const periodConfig = {
    daily: {
      trunc: "day",
      where: "WHERE created_at >= NOW() - INTERVAL '6 days'",
      order: "ORDER BY period_start ASC",
      labelFormat: { day: "2-digit", month: "short" }
    },
    monthly: {
      trunc: "month",
      where: "WHERE DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE)",
      order: "ORDER BY period_start ASC",
      labelFormat: { month: "short" }
    },
    yearly: {
      trunc: "year",
      where: "",
      order: "ORDER BY period_start ASC",
      labelFormat: { year: "numeric" }
    }
  };

  if (!periodConfig[period]) {
    return res.status(400).json({ message: "Period tidak valid. Gunakan daily, monthly, atau yearly." });
  }

  const config = periodConfig[period];
  const query = `
    SELECT
      DATE_TRUNC('${config.trunc}', created_at) AS period_start,
      COALESCE(SUM(total_price), 0) AS total
    FROM sales
    ${config.where}
    GROUP BY period_start
    ${config.order}
  `;

  try {
    const result = await pool.query(query);
    const formatter = new Intl.DateTimeFormat("id-ID", config.labelFormat);
    const labels = result.rows.map((row) => formatter.format(new Date(row.period_start)));
    const values = result.rows.map((row) => Number(row.total));
    const totalRevenue = values.reduce((sum, value) => sum + value, 0);

    return res.json({
      period,
      labels,
      values,
      totalRevenue
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengakses data laporan dari PostgreSQL."
    });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Gagal logout." });
    }
    return res.json({ message: "Logout berhasil." });
  });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Fatal error:", error?.message || error);
    process.exit(1);
  });
