// Dashboard page logic: cards, recent transactions, stock overview chart

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page !== "dashboard") return;

  const addBtn = document.getElementById("btn-dashboard-add-product");
  const exportBtn = document.getElementById("btn-dashboard-export");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      window.location.href = "products.html";
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      showAlert(
        "info",
        "Implement snapshot export using your preferred report endpoint."
      );
    });
  }

  loadDashboardSummary();
});

async function loadDashboardSummary() {
  try {
    const summary = await apiGet("/dashboard/summary");

    const totalProducts = document.getElementById("stat-total-products");
    const lowStock = document.getElementById("stat-low-stock");
    const categories = document.getElementById("stat-categories");
    const suppliers = document.getElementById("stat-suppliers");

    if (totalProducts) totalProducts.textContent = summary.totalProducts ?? 0;
    if (lowStock) lowStock.textContent = summary.lowStockCount ?? 0;
    if (categories) categories.textContent = summary.totalCategories ?? 0;
    if (suppliers) suppliers.textContent = summary.totalSuppliers ?? 0;

    if (setLowStockBadge) {
      setLowStockBadge(summary.lowStockCount ?? 0);
    }

    const txBody = document.getElementById("dashboard-transactions-body");
    if (txBody) {
      renderRecentTransactions(txBody, summary.recentTransactions || []);
    }

    const ctx = document.getElementById("stock-chart");
    if (ctx && window.Chart) {
      renderStockChart(
        ctx,
        (summary.stockByCategory || []).map((c) => c.categoryName),
        (summary.stockByCategory || []).map((c) => c.totalQuantity)
      );
    }
  } catch (err) {
    const txBody = document.getElementById("dashboard-transactions-body");
    if (txBody) {
      txBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted">Unable to load dashboard data. Check API configuration.</td>
        </tr>
      `;
    }
  }
}

function renderRecentTransactions(tbody, items) {
  if (!items.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-muted">No recent transactions yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items
    .map((tx) => {
      const typeLabel = tx.type === "IN" ? "Stock In" : "Stock Out";
      const typeColor =
        tx.type === "IN" ? "status-in" : "status-out";
      const dateStr = tx.transactionDate || tx.createdAt || "";
      return `
        <tr>
          <td>${tx.reference || "-"}</td>
          <td>${tx.productName || "-"}</td>
          <td>
            <span class="status-pill ${typeColor}">
              <i class="fas ${tx.type === "IN" ? "fa-arrow-down" : "fa-arrow-up"}"></i>
              ${typeLabel}
            </span>
          </td>
          <td>${tx.quantity ?? 0}</td>
          <td>${tx.performedBy || "-"}</td>
          <td>${dateStr}</td>
        </tr>
      `;
    })
    .join("");
}

function renderStockChart(ctx, labels, values) {
  const hasData = labels && labels.length > 0;

  const chartLabels = hasData ? labels : ["No data"];
  const chartValues = hasData ? values : [1];

  const palette = [
    "#6366f1",
    "#22c55e",
    "#0ea5e9",
    "#f97316",
    "#e11d48",
    "#a855f7",
  ];

  // eslint-disable-next-line no-new
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: chartLabels,
      datasets: [
        {
          data: chartValues,
          backgroundColor: chartLabels.map(
            (_, idx) => palette[idx % palette.length]
          ),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            usePointStyle: true,
          },
        },
      },
      cutout: "65%",
    },
  });
}

