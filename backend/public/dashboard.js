const welcomeText = document.getElementById("welcomeText");
const productList = document.getElementById("productList");
const cartList = document.getElementById("cartList");
const totalPrice = document.getElementById("totalPrice");
const payBtn = document.getElementById("payBtn");
const logoutBtn = document.getElementById("logoutBtn");
const addProductToggleBtn = document.getElementById("addProductToggleBtn");
const refreshProductsBtn = document.getElementById("refreshProductsBtn");
const addProductPanel = document.getElementById("addProductPanel");
const productHint = document.getElementById("productHint");
const addProductForm = document.getElementById("addProductForm");

let products = [];
const cart = new Map();
let currentUser = null;

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

const api = {
  async getSession() {
    const response = await fetch("/api/me");
    const data = await response.json();
    return { response, data };
  },
  async getProducts(includeAll = false) {
    const url = includeAll ? "/api/products?all=1" : "/api/products";
    const response = await fetch(url);
    const data = await response.json();
    return { response, data };
  },
  async addProduct(payload) {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return { response, data };
  },
  async checkout(items) {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });
    const data = await response.json();
    return { response, data };
  },
  async logout() {
    return fetch("/api/logout", { method: "POST" });
  }
};

function renderProducts() {
  if (products.length === 0) {
    productList.innerHTML = '<div class="empty">Belum ada produk tersedia.</div>';
    return;
  }

  productList.innerHTML = products
    .map(
      (product) => `
        <div class="product-item">
          <strong>${product.name}</strong>
          <div class="product-meta">
            <span class="muted">${formatRupiah(product.price)} | Stok: ${product.stock}</span>
            <button type="button" data-id="${product.id}">Tambah</button>
          </div>
        </div>
      `
    )
    .join("");

  productList.querySelectorAll("button[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(Number(button.dataset.id));
    });
  });
}

function renderCart() {
  const entries = Array.from(cart.values());
  if (entries.length === 0) {
    cartList.innerHTML = '<div class="empty">Keranjang masih kosong.</div>';
    totalPrice.textContent = formatRupiah(0);
    payBtn.disabled = true;
    return;
  }

  let total = 0;
  cartList.innerHTML = entries
    .map((item) => {
      const subtotal = item.price * item.qty;
      total += subtotal;

      return `
        <div class="cart-item">
          <strong>${item.name}</strong>
          <span class="muted">${item.qty} x ${formatRupiah(item.price)} = ${formatRupiah(subtotal)}</span>
          <button type="button" data-remove-id="${item.id}">Hapus</button>
        </div>
      `;
    })
    .join("");

  totalPrice.textContent = formatRupiah(total);
  payBtn.disabled = false;

  cartList.querySelectorAll("button[data-remove-id]").forEach((button) => {
    button.addEventListener("click", () => {
      cart.delete(Number(button.dataset.removeId));
      renderCart();
    });
  });
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  const currentQty = cart.get(productId)?.qty || 0;
  if (currentQty >= product.stock) {
    alert("Jumlah di keranjang melebihi stok.");
    return;
  }

  cart.set(productId, {
    id: product.id,
    name: product.name,
    price: product.price,
    qty: currentQty + 1
  });

  renderCart();
}

async function loadSession() {
  const { response, data } = await api.getSession();

  if (!response.ok || !data.loggedIn) {
    window.location.href = "/";
    return false;
  }

  currentUser = data.user;
  welcomeText.textContent = `Halo, ${data.user.username}. Selamat bekerja.`;
  addProductToggleBtn.disabled = false;
  addProductToggleBtn.title = "Buka form tambah produk";
  productHint.textContent = "Masukkan detail produk baru untuk ditambahkan ke database.";
  return true;
}

async function loadProducts() {
  const { response, data } = await api.getProducts(true);

  if (!response.ok) {
    alert(data.message || "Gagal mengambil data produk.");
    productList.innerHTML = '<div class="empty">Gagal memuat produk.</div>';
    return;
  }

  products = data.products;
  renderProducts();
}

payBtn.addEventListener("click", async () => {
  const items = Array.from(cart.values()).map((item) => ({
    id: item.id,
    qty: item.qty
  }));

  if (items.length === 0) {
    alert("Keranjang masih kosong.");
    return;
  }

  const { response, data } = await api.checkout(items);

  if (!response.ok) {
    alert(data.message || "Checkout gagal.");
    return;
  }

  alert(`${data.message} Total: ${formatRupiah(data.totalPrice)}`);
  cart.clear();
  renderCart();
  loadProducts();
});

refreshProductsBtn.addEventListener("click", () => {
  loadProducts();
});

addProductForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(addProductForm);
  const payload = {
    name: formData.get("name"),
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock"))
  };

  const { response, data } = await api.addProduct(payload);
  alert(data.message);

  if (response.ok) {
    addProductForm.reset();
    loadProducts();
  }
});

addProductToggleBtn.addEventListener("click", () => {
  const isHidden = addProductPanel.classList.contains("hidden");
  addProductPanel.classList.toggle("hidden", !isHidden);
  if (isHidden) {
    addProductPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

logoutBtn.addEventListener("click", async () => {
  const response = await api.logout();
  if (response.ok) {
    window.location.href = "/";
  }
});

async function init() {
  const isLoggedIn = await loadSession();
  if (!isLoggedIn) {
    return;
  }
  await loadProducts();
  renderCart();
}

init();
