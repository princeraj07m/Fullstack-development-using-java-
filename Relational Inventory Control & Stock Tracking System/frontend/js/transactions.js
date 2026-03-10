// Transactions page: static demo UI with in-memory data only

let transactionsState = {
  all: [
    {
      reference: "TX-001",
      productId: "P-1001",
      productName: "Laptop Pro 14\"",
      type: "IN",
      quantity: 10,
      performedBy: "Arjun",
      transactionDate: "2026-02-20",
    },
    {
      reference: "TX-002",
      productId: "P-1002",
      productName: "Office Chair",
      type: "OUT",
      quantity: 3,
      performedBy: "Priya",
      transactionDate: "2026-02-21",
    },
    {
      reference: "TX-003",
      productId: "P-1003",
      productName: "HDMI Cable 2m",
      type: "IN",
      quantity: 50,
      performedBy: "System",
      transactionDate: "2026-02-22",
    },
  ],
  page: 1,
  pageSize: 10,
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page !== "transactions") return;

  const form = document.getElementById("transaction-form");
  if (form) form.addEventListener("submit", submitTransactionForm);

  renderTransactionTable();
});

function renderTransactionTable() {
  const tbody = document.getElementById("tx-table-body");
  const paginationEl = document.getElementById("tx-pagination");
  if (!tbody) return;

  if (!transactionsState.all.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-muted">No transactions recorded yet.</td>
      </tr>
    `;
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }

  const pageState = paginate(
    transactionsState.all,
    transactionsState.page,
    transactionsState.pageSize
  );

  tbody.innerHTML = pageState.pageItems
    .map((tx) => {
      const typeLabel = tx.type === "IN" ? "Stock In" : "Stock Out";
      const typeClass = tx.type === "IN" ? "status-in" : "status-out";
      return `
        <tr>
          <td>${tx.reference || "-"}</td>
          <td>${tx.productName || tx.productId || "-"}</td>
          <td>
            <span class="status-pill ${typeClass}">${typeLabel}</span>
          </td>
          <td>${tx.quantity ?? 0}</td>
          <td>${tx.performedBy || "-"}</td>
          <td>${tx.transactionDate || tx.createdAt || "-"}</td>
        </tr>
      `;
    })
    .join("");

  createPaginationControls({
    container: paginationEl,
    pageState,
    onPageChange: (page) => {
      transactionsState.page = page;
      renderTransactionTable();
    },
  });
}

function submitTransactionForm(evt) {
  evt.preventDefault();
  const form = evt.target;
  const errors = {};

  const productId = form.productId.value.trim();
  const type = form.type.value;
  const quantity = parseInt(form.quantity.value, 10);
  const reference = form.reference.value.trim();
  const performedBy = form.performedBy.value.trim();
  const transactionDate = form.transactionDate.value || null;
  const notes = form.notes.value.trim();

  if (!productId) errors.productId = "Product ID is required.";
  if (!type) errors.type = "Type is required.";
  if (Number.isNaN(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be a positive integer.";
  }

  form.querySelectorAll(".form-error").forEach((el) => (el.textContent = ""));
  Object.keys(errors).forEach((key) => {
    const el = form.querySelector(`[data-error-for="${key}"]`);
    if (el) el.textContent = errors[key];
  });

  if (Object.keys(errors).length) return;

  const payload = {
    productId,
    type,
    quantity,
    reference,
    performedBy,
    transactionDate,
    notes,
  };

  transactionsState.all.unshift({
    reference: `TX-${String(transactionsState.all.length + 1).padStart(3, "0")}`,
    ...payload,
  });

  showAlert("success", "Transaction recorded (demo only, no backend).");
  form.reset();
  renderTransactionTable();
}

