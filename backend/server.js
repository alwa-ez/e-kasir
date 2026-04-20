const express = require("express");
const { Pool } = require("pg");
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

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

async function initializeDatabase() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL database.");
    const schema = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schema);
    console.log("Database schema initialized.");
  } catch (error) {
    console.error("Failed to initialize database:", error.message);
    process.exit(1);
  }
}

app.use(express.static(publicPath));

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
  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (!normalizedName) {
    return res.status(400).json({ message: "Nama produk wajib diisi." });
  }

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: "Harga produk tidak valid." });
  }

  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    return res.status(400).json({ message: "Stok produk tidak valid." });
  }

  try {
    const result = await pool.query(
      "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING id, name, price, stock",
      [normalizedName, parsedPrice, parsedStock]
    );
    return res.status(201).json({
      message: "Produk berhasil ditambahkan.",
      product: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal menambahkan produk." });
  }
});

app.post("/api/checkout", requireAuth, async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Keranjang belanja kosong." });
  }

  const groupedItems = new Map();
  for (const item of items) {
    const id = Number(item.id);
    const qty = Number(item.qty);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: "Data keranjang tidak valid." });
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
      totalPrice += Number(product.price) * item.qty;
    }

    await client.query("BEGIN");
    for (const item of normalizedItems) {
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.qty, item.id]);
    }

    await client.query("COMMIT");
    return res.json({ message: "Check out berhasil.", totalPrice });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      // Ignore rollback errors.
    }
    return res.status(500).json({ message: "Gagal memproses checkout." });
  } finally {
    client.release();
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

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
