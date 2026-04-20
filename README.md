# E-Kasir - Aplikasi Kasir Full-Stack Sederhana

E-Kasir adalah aplikasi kasir berbasis web dengan arsitektur sederhana dan mudah dipahami.  
Project ini dibuat menggunakan **HTML, CSS, Vanilla JavaScript, Node.js (Express), dan SQLite**.

---

## 1) Tujuan Aplikasi

Aplikasi ini membantu proses kasir dasar:

- Register dan login user (menggunakan session).
- Menampilkan daftar produk.
- Menambahkan produk baru dari dashboard.
- Menambahkan produk ke keranjang belanja.
- Menghitung total belanja.
- Proses check out dan mengurangi stok di database.

---

## 2) Stack Teknologi

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: SQLite (`kasir.db`)
- **Auth & Session**:
  - `bcrypt` untuk hash password
  - `express-session` untuk login session

---

## 3) Struktur Folder

```text
e-Kasir/
├── README.md
└── backend/
    ├── package.json
    ├── server.js
    ├── db/
    │   ├── schema.sql
    │   └── kasir.db              (terbentuk otomatis saat aplikasi jalan)
    └── public/
        ├── index.html            (halaman login/register)
        ├── styles.css            (style login/register)
        ├── script.js             (logic login/register)
        ├── dashboard.html        (halaman kasir)
        ├── dashboard.css         (style dashboard)
        └── dashboard.js          (logic produk, keranjang, checkout)
```

---

## 4) Fitur Utama

### A. Authentication
- User bisa **register** akun baru.
- User bisa **login** menggunakan username + password.
- Password disimpan dalam bentuk hash (bukan plain text).
- Session disimpan di server selama user masih login.

### B. Product Management
- User yang sudah login dapat:
  - Melihat semua produk.
  - Menambahkan produk baru melalui tombol **Add Product** di dashboard.

### C. Transaksi Kasir
- Pilih barang dari daftar produk.
- Barang masuk ke **keranjang belanja**.
- Total harga dihitung otomatis.
- Tombol **Check Out** akan:
  - validasi stok,
  - mengurangi stok di SQLite,
  - menampilkan total pembayaran,
  - mengosongkan keranjang di sisi client.

---

## 5) Cara Menjalankan Aplikasi

### Prasyarat

- Sudah terinstal **Node.js** (disarankan versi LTS).

### Langkah Menjalankan

1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan server:
   ```bash
   npm start
   ```
4. Buka browser:
   - [http://localhost:3000](http://localhost:3000)

---

## 6) Alur Penggunaan (Untuk Demo Presentasi)

1. Buka aplikasi di browser.
2. Register user baru.
3. Login menggunakan akun tersebut.
4. Masuk ke dashboard.
5. Klik **Add Product** lalu tambah beberapa produk.
6. Pilih produk ke keranjang.
7. Klik **Check Out**.
8. Tunjukkan bahwa:
   - total pembayaran muncul,
   - stok produk berkurang,
   - keranjang kembali kosong.

---

## 7) Endpoint API (Ringkas)

### Auth
- `POST /api/register` -> register user
- `POST /api/login` -> login user
- `GET /api/me` -> cek session login
- `POST /api/logout` -> logout user

### Product
- `GET /api/products` -> ambil daftar produk
- `POST /api/products` -> tambah produk

### Checkout
- `POST /api/checkout` -> proses pembayaran dan update stok

---

## 8) Skema Database Sederhana

### Tabel `users`
- `id` (INTEGER, PK, AUTOINCREMENT)
- `username` (TEXT, UNIQUE, NOT NULL)
- `password` (TEXT, NOT NULL)

### Tabel `products`
- `id` (INTEGER, PK, AUTOINCREMENT)
- `name` (TEXT, NOT NULL)
- `price` (REAL, NOT NULL, >= 0)
- `stock` (INTEGER, NOT NULL, default 0, >= 0)

---

## 9) Catatan Pengembangan Lanjutan (Opsional)

Untuk tahap berikutnya, aplikasi bisa ditingkatkan dengan:

- Edit/hapus produk.
- Riwayat transaksi.
- Dashboard laporan penjualan.
- Validasi form yang lebih lengkap.
- Pengamanan session untuk production (`secure cookie`, `env secret`).

---

## 10) Ringkasan Singkat untuk Slide

> E-Kasir adalah aplikasi kasir full-stack sederhana yang mengimplementasikan alur bisnis utama kasir: autentikasi, manajemen produk, keranjang, dan checkout dengan update stok real-time di SQLite. Arsitektur dibuat modular dan ringan agar mudah dipelajari, dikembangkan, dan dipresentasikan.

