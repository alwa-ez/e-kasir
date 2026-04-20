# E-Kasir - Simple Full-Stack Cashier App

E-Kasir is a web-based cashier application with a clean and beginner-friendly architecture.  
This project uses **HTML, CSS, Vanilla JavaScript, Node.js (Express), and PostgreSQL**.

---

## 1) Project Goals

The app covers a basic cashier workflow:

- User registration and login (session-based auth)
- Product listing
- Product creation from dashboard UI
- Shopping cart handling
- Total price calculation
- Checkout process with stock deduction in database

---

## 2) Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth & Session**:
  - `bcrypt` for password hashing
  - `express-session` for login session management

---

## 3) Folder Structure

```text
e-Kasir/
├── README.md
└── backend/
    ├── package.json
    ├── .env.example
    ├── server.js
    ├── db/
    │   └── schema.sql
    └── public/
        ├── index.html
        ├── styles.css
        ├── script.js
        ├── dashboard.html
        ├── dashboard.css
        └── dashboard.js
```

---

## 4) Main Features

### A) Authentication
- Register a new account
- Login with username and password
- Password is stored as a hash (not plain text)
- Session persists while user is logged in

### B) Product Management
- Logged-in users can:
  - View all products
  - Add a new product from the dashboard (`Add Product`)

### C) Cashier Transaction
- Add products to cart
- Calculate total automatically
- `Check Out` button:
  - validates product stock
  - deducts stock in PostgreSQL
  - returns checkout total
  - clears cart on client side

---

## 5) Setup & Run

### Prerequisites

- Node.js (LTS recommended)
- PostgreSQL source:
  - local PostgreSQL instance, or
  - cloud PostgreSQL (recommended: Supabase Pooler)

### Steps

1. Go to backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env
   ```
   On Windows PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Update `.env` for your PostgreSQL connection:
   ```env
   PORT=3000
   SESSION_SECRET=dev-secret-change-this
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/e_kasir
   ```

   Supabase Pooler example:
   ```env
   DATABASE_URL=postgresql://postgres.<project-ref>:<db-password>@aws-<region>.pooler.supabase.com:5432/postgres
   ```

5. If you use local PostgreSQL, create database first:
   ```sql
   CREATE DATABASE e_kasir;
   ```
6. Start server:
   ```bash
   npm start
   ```
7. Open browser:
   - [http://localhost:3000](http://localhost:3000)

> On startup, the server automatically executes `backend/db/schema.sql` to create required tables.

---

## 6) Troubleshooting

### App stuck on loading screen
- Hard refresh browser (`Ctrl + F5`)
- Clear cookies for `localhost`
- Re-login to regenerate session

### PostgreSQL connection fails
- Verify `DATABASE_URL` format
- For Supabase, prefer Pooler endpoint instead of direct `db.<project-ref>.supabase.co`
- Make sure username format is `postgres.<project-ref>`
- Confirm DB password is correct and active

### Port already in use (`EADDRINUSE: 3000`)
- Stop the process using port 3000, then run `npm start` again
- Or set a different port in `.env`:
  ```env
  PORT=3001
  ```

---

## 7) Demo Flow (Presentation Ready)

1. Open the app in browser.
2. Register a new user.
3. Login using the new account.
4. Open dashboard.
5. Click `Add Product` and create some products.
6. Add products to cart.
7. Click `Check Out`.
8. Show that:
   - total payment appears,
   - stock is reduced in database,
   - cart is cleared.

---

## 8) API Endpoints (Summary)

### Auth
- `POST /api/register` -> create user
- `POST /api/login` -> login user
- `GET /api/me` -> check login session
- `POST /api/logout` -> logout user

### Product
- `GET /api/products` -> list products
- `POST /api/products` -> create product

### Checkout
- `POST /api/checkout` -> process checkout and update stock

---

## 9) Database Schema

### `users`
- `id` (SERIAL, PK)
- `username` (VARCHAR, UNIQUE, NOT NULL)
- `password` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP)

### `products`
- `id` (SERIAL, PK)
- `name` (VARCHAR, NOT NULL)
- `price` (NUMERIC, NOT NULL, >= 0)
- `stock` (INTEGER, NOT NULL, >= 0)
- `created_at` (TIMESTAMP)

---

## 10) Optional Next Improvements

- Product edit/delete
- Transaction history
- Sales report dashboard
- Better form validation and error UI
- Production-grade session store (Redis) and secure cookies

---

## 11) Slide-Friendly Summary

> E-Kasir is a simple full-stack cashier app that demonstrates complete business flow: authentication, product management, cart, and checkout with real-time stock updates in PostgreSQL. The architecture is intentionally lightweight and modular for learning and presentation purposes.

