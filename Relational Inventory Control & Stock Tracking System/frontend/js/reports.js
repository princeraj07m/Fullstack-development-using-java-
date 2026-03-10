// Reports page: static demo UI with filter + CSV export (no backend)

let reportsState = {
  rows: [],
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page !== "reports") return;

  const form = document.getElementById("reports-filter-form");
  const exportBtn = document.getElementById("btn-export-csv");

  if (form) form.addEventListener("submit", submitReportFilter);
  if (exportBtn) exportBtn.addEventListener("click", () => exportCsv());
});

function submitReportFilter(evt) {
  evt.preventDefault();
  const form = evt.target;
  const errors = {};

  const fromDate = form.from.value;
  const toDate = form.to.value;
  const type = form.type.value;

  if (!fromDate) errors.from = "From date is required.";
  if (!toDate) errors.to = "To date is required.";
  if (fromDate && toDate && fromDate > toDate) {
    errors.to = "To date must be after From date.";
  }

  form.querySelectorAll(".form-error").forEach((el) => (el.textContent = ""));
  Object.keys(errors).forEach((key) => {
    const el = form.querySelector(`[data-error-for="${key}"]`);
    if (el) el.textContent = errors[key];
  });
  if (Object.keys(errors).length) return;

  // Generate some demo rows locally instead of calling an API
  const demoRows = [];

  if (type === "STOCK") {
    demoRows.push(
      { ProductId: "P-1001", Name: "Laptop Pro 14\"", Category: "Electronics", Quantity: 24 },
      { ProductId: "P-1002", Name: "Office Chair", Category: "Furniture", Quantity: 6 },
      { ProductId: "P-1003", Name: "HDMI Cable 2m", Category: "Accessories", Quantity: 0 },
    );
  } else if (type === "TRANSACTIONS") {
    demoRows.push(
      { Ref: "TX-001", ProductId: "P-1001", Type: "IN", Qty: 10, Date: fromDate },
      { Ref: "TX-002", ProductId: "P-1002", Type: "OUT", Qty: 3, Date: toDate },
    );
  } else if (type === "LOW_STOCK") {
    demoRows.push(
      { ProductId: "P-1002", Name: "Office Chair", Category: "Furniture", Qty: 6, Threshold: 10 },
      { ProductId: "P-1003", Name: "HDMI Cable 2m", Category: "Accessories", Qty: 0, Threshold: 20 },
    );
  }

  reportsState.rows = demoRows;
  renderReportPreview();
  showAlert("success", "Demo report generated. Use Export CSV to download.");
}

function renderReportPreview() {
  const tbody = document.getElementById("reports-table-body");
  const thead = document.getElementById("reports-table-head");
  if (!tbody || !thead) return;

  if (!reportsState.rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-muted">No data returned for selected filters.</td>
      </tr>
    `;
    return;
  }

  const firstRow = reportsState.rows[0];
  const columns = Object.keys(firstRow);

  thead.innerHTML = `
    <tr>
      ${columns.map((c) => `<th>${c}</th>`).join("")}
    </tr>
  `;

  const previewRows = reportsState.rows.slice(0, 25);
  tbody.innerHTML = previewRows
    .map((row) => {
      return `
        <tr>
          ${columns.map((c) => `<td>${row[c] ?? ""}</td>`).join("")}
        </tr>
      `;
    })
    .join("");
}

function exportCsv() {
  if (!reportsState.rows.length) {
    showAlert("info", "Load a report first using the filters.");
    return;
  }

  const firstRow = reportsState.rows[0];
  const columns = Object.keys(firstRow);

  const header = columns.join(",");
  const lines = reportsState.rows.map((row) =>
    columns
      .map((c) => {
        const value = row[c] == null ? "" : String(row[c]);
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  );

  const csvContent = [header, ...lines].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.download = `inventory-report-${now}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAlert("success", "CSV export generated and downloaded.");
}

