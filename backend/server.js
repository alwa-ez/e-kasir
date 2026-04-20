const express = require("express");
const sqlite3 = require("sqlite3").verbose();
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

const dbPath = path.join(__dirname, "db", "kasir.db");
const schemaPath = path.join(__dirname, "db", "schema.sql");
const publicPath = path.join(__dirname, "public");

const db = new sqlite3.Database(dbPath, initializeDatabase);

function initializeDatabase(err) {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
    process.exit(1);
  }

  console.log("Connected to SQLite database.");

  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema, (schemaErr) => {
    if (schemaErr) {
      console.error("Failed to initialize database schema:", schemaErr.message);
      process.exit(1);
    }

    db.all("PRAGMA table_info(users)", [], (pragmaErr, rows) => {
      if (pragmaErr) {
        console.error("Failed to read users table info:", pragmaErr.message);
        process.exit(1);
      }

      const hasAdminColumn = rows.some((column) => column.name === "is_admin");
      if (hasAdminColumn) {
        console.log("Database schema initialized.");
        return;
      }

      db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0", (alterErr) => {
        if (alterErr) {
          console.error("Failed to migrate users table:", alterErr.message);
          process.exit(1);
        }
        console.log("Database schema initialized.");
      });
    });
  });
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

    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [normalizedUsername, hashedPassword],
      function registerCallback(err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.status(409).json({ message: "Username sudah digunakan." });
          }
          return res.status(500).json({ message: "Gagal melakukan register." });
        }

        return res.status(201).json({
          message: "Register berhasil.",
          user: { id: this.lastID, username: normalizedUsername }
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = String(username || "").trim();

  if (!normalizedUsername || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi." });
  }

  db.get(
    "SELECT id, username, password FROM users WHERE username = ?",
    [normalizedUsername],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ message: "Gagal melakukan login." });
      }

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
    }
  );
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false });
  }
  return res.json({ loggedIn: true, user: req.session.user });
});

app.get("/api/products", requireAuth, (req, res) => {
  db.all("SELECT id, name, price, stock FROM products ORDER BY name ASC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Gagal mengambil produk." });
    }
    return res.json({ products: rows });
  });
});

app.post("/api/products", requireAuth, (req, res) => {
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

  db.run(
    "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
    [normalizedName, parsedPrice, parsedStock],
    function addProductCallback(err) {
      if (err) {
        return res.status(500).json({ message: "Gagal menambahkan produk." });
      }
      return res.status(201).json({
        message: "Produk berhasil ditambahkan.",
        product: { id: this.lastID, name: normalizedName, price: parsedPrice, stock: parsedStock }
      });
    }
  );
});

app.post("/api/checkout", requireAuth, (req, res) => {
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
  const placeholders = ids.map(() => "?").join(", ");

  db.all(
    `SELECT id, name, price, stock FROM products WHERE id IN (${placeholders})`,
    ids,
    (fetchErr, products) => {
      if (fetchErr) {
        return res.status(500).json({ message: "Gagal memproses checkout." });
      }

      const productMap = new Map(products.map((product) => [product.id, product]));
      let totalPrice = 0;

      for (const item of normalizedItems) {
        const product = productMap.get(item.id);
        if (!product) {
          return res.status(400).json({ message: `Produk dengan id ${item.id} tidak ditemukan.` });
        }
        if (product.stock < item.qty) {
          return res
            .status(400)
            .json({ message: `Stok ${product.name} tidak cukup. Sisa stok: ${product.stock}.` });
        }
        totalPrice += product.price * item.qty;
      }

      db.run("BEGIN TRANSACTION", (beginErr) => {
        if (beginErr) {
          return res.status(500).json({ message: "Gagal memulai transaksi checkout." });
        }

        let pending = normalizedItems.length;
        let hasFailed = false;

        normalizedItems.forEach((item) => {
          db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [item.qty, item.id], (updateErr) => {
            if (hasFailed) {
              return;
            }

            if (updateErr) {
              hasFailed = true;
              db.run("ROLLBACK");
              return res.status(500).json({ message: "Gagal memperbarui stok produk." });
            }

            pending -= 1;
            if (pending === 0) {
              db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ message: "Gagal menyelesaikan checkout." });
                }
                return res.json({ message: "Check out berhasil.", totalPrice });
              });
            }
          });
        });
      });
    }
  );
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Gagal logout." });
    }
    return res.json({ message: "Logout berhasil." });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
