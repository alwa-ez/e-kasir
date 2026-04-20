# E-Kasir - Simple Web-Based Point of Sale Application

E-Kasir is a lightweight, web-based point of sale (POS) application built with **Node.js (Express)**, **PostgreSQL**, and **Vanilla JavaScript**. It provides essential features for managing sales transactions, products, and inventory with an intuitive web interface.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Usage Guide](#usage-guide)
- [License](#license)

## ✨ Features

### Authentication
- **User Registration**: Create new user accounts with username and password
- **Login/Logout**: Secure session-based authentication
- **Session Management**: Persistent user sessions with automatic expiration

### Product Management
- **Add New Products**: Create and store products with name, price, and initial stock
- **Update Stock**: Easily add stock to existing products from the dashboard
- **Product Listing**: View all products with their current prices and stock levels
- **Price Management**: Update product prices dynamically

### Sales & Checkout
- **Shopping Cart**: Add products to a cart with quantity selection
- **Stock Validation**: Real-time validation to prevent overselling
- **Checkout Process**: Secure transaction processing with database integrity
- **Atomic Transactions**: Database transactions ensure consistency (stock reduction + sales recording)
- **Sales History**: Complete record of all transactions

### Reports & Analytics
- **Sales Dashboard**: Visual representation of sales data using Chart.js
- **Multiple Periods**: Filter reports by:
  - Daily (last 6 days)
  - Monthly (current year)
  - Yearly (all time)
- **Revenue Analysis**: Track total revenue for each period
- **Interactive Charts**: Easy-to-read charts for business insights

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Authentication** | bcrypt (password hashing), express-session |
| **Charts** | Chart.js (via CDN) |

### Dependencies

```json
{
  "express": "^4.19.2",
  "pg": "^8.20.0",
  "bcrypt": "^5.1.1",
  "express-session": "^1.18.1",
  "dotenv": "^17.4.2"
}
```

## 📋 Prerequisites

Before running the application, ensure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) or **Supabase** account - [Download](https://www.postgresql.org/) or [Sign Up](https://supabase.com/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning the repository)

## 🚀 Installation

### Step 1: Clone or Download the Repository

```bash
# Clone the repository
git clone <repository-url>
cd e-Kasir/backend

# Or navigate to the backend folder if downloaded as ZIP
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the `backend` folder:

```bash
# Copy from example (if available)
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/e_kasir

# Server Configuration
PORT=3000

# Session Security
SESSION_SECRET=your-secret-key-change-this-in-production
```

### Step 4: Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

```bash
# Create database
createdb e_kasir

# Create PostgreSQL user (if needed)
# psql -U postgres
# CREATE USER your_user WITH PASSWORD 'your_password';
# ALTER ROLE your_user WITH CREATEDB;
```

Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/e_kasir
```

#### Option B: Supabase (Cloud)

1. Create a project at [Supabase](https://supabase.com/)
2. Get your connection string from Project Settings → Database
3. Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/e_kasir` |
| `PORT` | Server port (default: 3000) | `3000` |
| `SESSION_SECRET` | Secret key for session encryption | `your-secret-key` |

### Security Notes

- **Change `SESSION_SECRET`** in production to a strong, random value
- **Use environment variables** for sensitive data (never commit `.env`)
- **Enable SSL** for database connections in production
- **Use HTTPS** when deploying to production

## ▶️ Running the Application

### Start the Server

```bash
# From the backend folder
npm start
```

Expected output:
```
Connected to PostgreSQL database.
Database schema initialized.
Server is running on port 3000
```

### Access the Application

Open your browser and navigate to:
- **Home Page (Login)**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3000/dashboard.html` (after login)
- **Reports**: `http://localhost:3000/reports.html` (after login)

## 📁 Project Structure

```
e-Kasir/
├── README.md                      # This file
└── backend/
    ├── .env.example               # Environment variables template
    ├── .env                       # Environment variables (not committed)
    ├── package.json               # Project dependencies
    ├── server.js                  # Express server & API endpoints
    ├── db/
    │   └── schema.sql             # Database schema & tables
    └── public/                    # Frontend files
        ├── index.html             # Login page
        ├── styles.css             # Global styles
        ├── script.js              # Login & auth logic
        ├── dashboard.html         # Main dashboard
        ├── dashboard.css          # Dashboard styles
        ├── dashboard.js           # Dashboard logic
        ├── reports.html           # Sales reports page
        ├── reports.css            # Reports styles
        └── reports.js             # Reports & charts logic
```

## 🔌 API Endpoints

All endpoints (except login/register) require authentication.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/register` | Register new user |
| `POST` | `/api/login` | Login user |
| `GET` | `/api/me` | Get current user info |
| `POST` | `/api/logout` | Logout user |

#### Register
```bash
POST /api/register
Content-Type: application/json

{
  "username": "cashier1",
  "password": "securepassword"
}

Response:
{
  "message": "Register berhasil.",
  "user": { "id": 1, "username": "cashier1" }
}
```

#### Login
```bash
POST /api/login
Content-Type: application/json

{
  "username": "cashier1",
  "password": "securepassword"
}

Response:
{
  "message": "Login berhasil.",
  "user": { "id": 1, "username": "cashier1" }
}
```

### Products (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products |
| `POST` | `/api/products` | Create new product or add stock |
| `PATCH` | `/api/products/:id/stock` | Add stock to product |

#### Get All Products
```bash
GET /api/products

Response:
{
  "products": [
    { "id": 1, "name": "Coffee", "price": "5000.00", "stock": 50 },
    { "id": 2, "name": "Tea", "price": "3000.00", "stock": 30 }
  ]
}
```

#### Create Product or Add Stock
```bash
POST /api/products
Content-Type: application/json

{
  "name": "Coffee",
  "price": 5000,
  "stock": 10
}

Response (if new):
{
  "message": "Produk berhasil ditambahkan.",
  "product": { "id": 1, "name": "Coffee", "price": "5000.00", "stock": 10 }
}

Response (if exists, stock added):
{
  "message": "Stok produk Coffee berhasil ditambahkan.",
  "product": { "id": 1, "name": "Coffee", "price": "5000.00", "stock": 20 }
}
```

#### Add Stock to Product
```bash
PATCH /api/products/1/stock
Content-Type: application/json

{
  "stockToAdd": 25
}

Response:
{
  "message": "Stok produk Coffee berhasil ditambahkan.",
  "product": { "id": 1, "name": "Coffee", "price": "5000.00", "stock": 45 }
}
```

### Checkout (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/checkout` | Process sale transaction |

#### Checkout
```bash
POST /api/checkout
Content-Type: application/json

{
  "items": [
    { "id": 1, "qty": 2 },
    { "id": 2, "qty": 1 }
  ]
}

Response:
{
  "message": "Check out berhasil.",
  "totalPrice": 13000
}
```

### Reports (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports?period=daily` | Get sales report with period filter |

#### Get Reports
```bash
GET /api/reports?period=daily

Response:
{
  "period": "daily",
  "labels": ["Sen, 20 Apr", "Sel, 21 Apr", "Rab, 22 Apr"],
  "values": [50000, 75000, 120000],
  "totalRevenue": 245000
}

# Supported periods:
# - daily: Monday to today (weekly view), grouped by day
# - monthly: January to December (all months in current year), grouped by month
# - yearly: Previous year and current year, grouped by year
```

**Period Details:**
- **daily**: Shows data from Monday (start of current week) to today, grouped by day. Perfect for weekly trends.
- **monthly**: Shows all 12 months (January-December) of the current year, grouped by month. Missing months show 0. Perfect for monthly trends within the year.
- **yearly**: Shows data from the previous year and current year, grouped by year. Currently 2025 and 2026.

## 💾 Database Schema

The application uses three main tables:

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sales Table
```sql
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  total_price DECIMAL NOT NULL CHECK (total_price >= 0),
  items JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📖 Usage Guide

### Getting Started

1. **Register an Account**
   - Go to `http://localhost:3000`
   - Click "Register" and create a new username and password
   - Minimum password length: 6 characters

2. **Add Products**
   - After login, go to the Dashboard
   - Click "Add Product"
   - Enter product name, price, and initial stock
   - Click "Save Product"

3. **Process Sales**
   - On the Dashboard, select products and quantities
   - Review cart items
   - Click "Checkout" to complete the transaction
   - Stock is automatically updated

4. **View Reports**
   - Go to the Reports page
   - Select period (Daily, Monthly, Yearly)
   - View sales trends and total revenue

### Tips

- **Stock Management**: You can add more stock to existing products without creating duplicates
- **Transaction Safety**: Each checkout is atomic - either all items are sold or none are
- **Session Timeout**: Sessions expire after 24 hours for security
- **Multiple Users**: Each user has their own session but accesses the same data

## 🐛 Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running: `psql -U postgres`
- Verify `DATABASE_URL` in `.env` is correct
- Ensure database exists: `createdb e_kasir`

### Port Already in Use
- Change `PORT` in `.env` to another port (e.g., 3001)
- Or kill the process using port 3000

### Login Not Working
- Clear browser cookies
- Check that user exists in database: `SELECT * FROM users;`
- Verify password is at least 6 characters

### Stock Issues During Checkout
- Check current stock: `SELECT * FROM products;`
- Ensure checkout items don't exceed available stock

## 📝 License

This project is provided as-is for educational and commercial use.

---

**Questions or Issues?** Please report them or contact the development team.

**Last Updated**: April 2026
        └── reports.js
```

## Setup

1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Install dependency:
   ```bash
   npm install
   ```
3. Buat file `.env`:
   ```bash
   cp .env.example .env
   ```
   PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Isi `.env`:
   ```env
   PORT=3000
   SESSION_SECRET=dev-secret-change-this
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/e_kasir
   ```
   Contoh Supabase Pooler:
   ```env
   DATABASE_URL=postgresql://postgres.<project-ref>:<db-password>@aws-<region>.pooler.supabase.com:5432/postgres
   ```
5. Jalankan server:
   ```bash
   npm start
   ```
6. Buka aplikasi:
   - `http://localhost:3000`
   - `http://localhost:3000/dashboard.html`
   - `http://localhost:3000/reports.html`

Server otomatis menjalankan `backend/db/schema.sql` saat startup.

## API Ringkas

### Auth
- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `POST /api/logout`

### Produk
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id/stock`

### Transaksi
- `POST /api/checkout`

### Laporan
- `GET /api/reports?period=daily|monthly|yearly`

## Skema Database

### `users`
- `id` SERIAL PRIMARY KEY
- `username` VARCHAR UNIQUE NOT NULL
- `password` TEXT NOT NULL
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### `products`
- `id` SERIAL PRIMARY KEY
- `name` VARCHAR NOT NULL
- `price` NUMERIC(12,2) NOT NULL
- `stock` INTEGER NOT NULL
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### `sales`
- `id` SERIAL PRIMARY KEY
- `total_price` DECIMAL NOT NULL
- `items` JSONB NOT NULL
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## Troubleshooting

### Port 3000 sudah dipakai

- Cari PID:
  ```powershell
  netstat -ano | Select-String ":3000"
  ```
- Matikan proses:
  ```powershell
  taskkill /PID <PID> /F
  ```

### Koneksi PostgreSQL gagal

- Pastikan `DATABASE_URL` valid.
- Untuk Supabase, gunakan endpoint Pooler.
- Pastikan kredensial database benar.

