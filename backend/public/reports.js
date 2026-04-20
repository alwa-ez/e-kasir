const welcomeText = document.getElementById("welcomeText");
const logoutBtn = document.getElementById("logoutBtn");
const totalRevenueEl = document.getElementById("totalRevenue");
const periodButtons = document.querySelectorAll(".period-btn");
const chartCanvas = document.getElementById("salesChart");

let currentPeriod = "daily";
let salesChart = null;

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function getPeriodLabel(period) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  
  const formatter = new Intl.DateTimeFormat("id-ID", { 
    day: "2-digit", 
    month: "long", 
    year: "numeric" 
  });
  
  switch(period) {
    case "daily":
      return `Minggu ini (${formatter.format(weekStart)} - ${formatter.format(now)})`;
    case "monthly":
      return `Tahun ini (Januari - Desember ${now.getFullYear()})`;
    case "yearly":
      const previousYear = now.getFullYear() - 1;
      return `Perbandingan Tahunan (${previousYear} - ${now.getFullYear()})`;
    default:
      return period;
  }
}

async function ensureSession() {
  try {
    const response = await fetch("/api/me");
    const data = await response.json();

    if (!response.ok || !data.loggedIn) {
      window.location.href = "/";
      return false;
    }

    welcomeText.textContent = `Halo, ${data.user.username}. Ringkasan penjualan siap ditinjau.`;
    return true;
  } catch (error) {
    welcomeText.textContent = "Gagal memuat sesi pengguna.";
    return false;
  }
}

function renderChart(labels, values, period) {
  if (salesChart) {
    salesChart.destroy();
  }

  const periodLabel = getPeriodLabel(period);

  salesChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: periodLabel,
          data: values,
          borderColor: "#6f87b7",
          backgroundColor: "rgba(111, 135, 183, 0.22)",
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.32,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 12,
            padding: 20,
            font: {
              size: 13
            }
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              return ` ${formatRupiah(context.parsed.y || 0)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              return formatRupiah(value);
            }
          }
        }
      }
    }
  });
}

async function loadReport(period) {
  currentPeriod = period;
  totalRevenueEl.textContent = "Memuat...";

  try {
    const response = await fetch(`/api/reports?period=${encodeURIComponent(period)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal memuat laporan.");
    }

    const labels = data.labels.length ? data.labels : ["Belum Ada Data"];
    const values = data.values.length ? data.values : [0];

    totalRevenueEl.textContent = formatRupiah(data.totalRevenue || 0);
    renderChart(labels, values, period);
  } catch (error) {
    totalRevenueEl.textContent = "-";
    renderChart(["Error"], [0], period);
    alert(error.message || "Terjadi gangguan saat mengambil laporan.");
  }
}

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedPeriod = button.dataset.period;
    if (!selectedPeriod || selectedPeriod === currentPeriod) {
      return;
    }

    periodButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    loadReport(selectedPeriod);
  });
});

logoutBtn.addEventListener("click", async () => {
  const response = await fetch("/api/logout", { method: "POST" });
  if (response.ok) {
    window.location.href = "/";
  }
});

async function init() {
  const authenticated = await ensureSession();
  if (!authenticated) {
    return;
  }
  await loadReport(currentPeriod);
}

init();
