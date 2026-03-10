// Products page: static demo UI with in-memory data only

const productsState = {
  all: [
    {
      id: "P-1001",
      name: "Laptop Pro 14\"",
      category: "Electronics",
      supplier: "TechSource",
      price: 89000,
      quantity: 24,
      status: "IN_STOCK",
      lowStockThreshold: 5,
      description: "Business laptop with 16GB RAM, 512GB SSD.",
    },
    {
      id: "P-1002",
      name: "Office Chair",
      category: "Furniture",
      supplier: "ComfortWorks",
      price: 7500,
      quantity: 6,
      status: "LOW_STOCK",
      lowStockThreshold: 10,
      description: "Ergonomic mesh back chair.",
    },
    {
      id: "P-1003",
      name: "HDMI Cable 2m",
      category: "Accessories",
      supplier: "CableMart",
      price: 350,
      quantity: 0,
      status: "OUT_OF_STOCK",
      lowStockThreshold: 20,
      description: "High speed HDMI 2.0.",
    },
  ],
  filtered: [],
  page: 1,
  pageSize: 10,
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page !== "products") return;

  const addBtn = document.getElementById("btn-add-product");
  if (addBtn) addBtn.addEventListener("click", () => openProductModal());

  const filterStatus = document.getElementById("filter-status");
  const filterCategory = document.getElementById("filter-category");

  if (filterStatus) filterStatus.addEventListener("change", () => applyProductsFilter());
  if (filterCategory) filterCategory.addEventListener("input", () => applyProductsFilter());

  window.addEventListener("global-search", (evt) => {
    applyProductsFilter(evt.detail.query);
  });

  productsState.filtered = [...productsState.all];
  renderProductsTable();
});

function applyProductsFilter(globalQuery) {
  const status = document.getElementById("filter-status")?.value || "";
  const category = (document.getElementById("filter-category")?.value || "")
    .trim()
    .toLowerCase();
  const search = typeof globalQuery === "string" ? globalQuery : "";

  productsState.filtered = productsState.all.filter((p) => {
    const matchesStatus = !status || p.status === status;
    const matchesCategory =
      !category ||
      (p.category && p.category.toLowerCase().includes(category));
    const matchesSearch =
      !search ||
      (p.name && p.name.toLowerCase().includes(search)) ||
      (p.sku && String(p.sku).toLowerCase().includes(search)) ||
      (p.supplier && p.supplier.toLowerCase().includes(search));
    return matchesStatus && matchesCategory && matchesSearch;
  });

  productsState.page = 1;
  renderProductsTable();
}

function renderProductsTable() {
  const tbody = document.getElementById("products-table-body");
  const paginationEl = document.getElementById("products-pagination");
  if (!tbody) return;

  if (!productsState.filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-muted">No products match your filters yet.</td>
      </tr>
    `;
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }

  const pageState = paginate(
    productsState.filtered,
    productsState.page,
    productsState.pageSize
  );

  tbody.innerHTML = pageState.pageItems
    .map((p) => {
      const statusClass =
        p.status === "IN_STOCK"
          ? "status-in"
          : p.status === "LOW_STOCK"
          ? "status-low"
          : "status-out";
      const statusLabel =
        p.status === "IN_STOCK"
          ? "In Stock"
          : p.status === "LOW_STOCK"
          ? "Low Stock"
          : "Out of Stock";

      return `
        <tr data-id="${p.id}">
          <td>${p.id}</td>
          <td>${p.name || "-"}</td>
          <td>${p.category || "-"}</td>
          <td>${p.supplier || "-"}</td>
          <td class="text-right">${formatCurrency(p.price)}</td>
          <td class="text-right">${p.quantity ?? 0}</td>
          <td>
            <span class="status-pill ${statusClass}">${statusLabel}</span>
          </td>
          <td class="text-right">
            <button class="btn btn-sm btn-outline" onclick="onEditProduct('${p.id}')">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="onDeleteProduct('${p.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  createPaginationControls({
    container: paginationEl,
    pageState,
    onPageChange: (page) => {
      productsState.page = page;
      renderProductsTable();
    },
  });
}

function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function buildProductForm(data = {}) {
  const form = document.createElement("form");
  form.id = "product-form";
  form.innerHTML = `
    <div class="form-row">
      <div class="form-control">
        <label for="product-name">Name</label>
        <input id="product-name" name="name" required maxlength="120" value="${data.name || ""}" />
        <div class="form-error" data-error-for="name"></div>
      </div>
      <div class="form-control">
        <label for="product-sku">Product ID / SKU</label>
        <input id="product-sku" name="sku" required maxlength="60" value="${data.sku || ""}" />
        <div class="form-error" data-error-for="sku"></div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-control">
        <label for="product-category">Category</label>
        <input id="product-category" name="category" required maxlength="80" value="${data.category || ""}" />
        <div class="form-error" data-error-for="category"></div>
      </div>
      <div class="form-control">
        <label for="product-supplier">Supplier</label>
        <input id="product-supplier" name="supplier" maxlength="80" value="${data.supplier || ""}" />
        <div class="form-error" data-error-for="supplier"></div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-control">
        <label for="product-price">Price</label>
        <input id="product-price" name="price" type="number" min="0" step="0.01" required value="${
          data.price ?? ""
        }" />
        <div class="form-error" data-error-for="price"></div>
      </div>
      <div class="form-control">
        <label for="product-quantity">Quantity</label>
        <input id="product-quantity" name="quantity" type="number" min="0" step="1" required value="${
          data.quantity ?? ""
        }" />
        <div class="form-error" data-error-for="quantity"></div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-control">
        <label for="product-threshold">Low Stock Threshold</label>
        <input id="product-threshold" name="lowStockThreshold" type="number" min="0" step="1" value="${
          data.lowStockThreshold ?? ""
        }" />
        <div class="form-error" data-error-for="lowStockThreshold"></div>
      </div>
      <div class="form-control">
        <label for="product-status">Status</label>
        <select id="product-status" name="status" required>
          <option value="IN_STOCK" ${data.status === "IN_STOCK" ? "selected" : ""}>In Stock</option>
          <option value="LOW_STOCK" ${data.status === "LOW_STOCK" ? "selected" : ""}>Low Stock</option>
          <option value="OUT_OF_STOCK" ${data.status === "OUT_OF_STOCK" ? "selected" : ""}>Out of Stock</option>
        </select>
        <div class="form-error" data-error-for="status"></div>
      </div>
    </div>

    <div class="form-control">
      <label for="product-description">Description</label>
      <textarea id="product-description" name="description" rows="2" maxlength="500">${
        data.description || ""
      }</textarea>
      <div class="form-error" data-error-for="description"></div>
    </div>
  `;

  return form;
}

function collectProductFormData() {
  const form = document.getElementById("product-form");
  const errors = {};

  const name = form.name.value.trim();
  const sku = form.sku.value.trim();
  const category = form.category.value.trim();
  const supplier = form.supplier.value.trim();
  const price = parseFloat(form.price.value);
  const quantity = parseInt(form.quantity.value, 10);
  const lowStockThreshold = form.lowStockThreshold.value
    ? parseInt(form.lowStockThreshold.value, 10)
    : null;
  const status = form.status.value;
  const description = form.description.value.trim();

  if (!name) errors.name = "Name is required.";
  if (!sku) errors.sku = "Product ID / SKU is required.";
  if (!category) errors.category = "Category is required.";
  if (Number.isNaN(price) || price < 0) errors.price = "Price must be a non-negative number.";
  if (Number.isNaN(quantity) || quantity < 0) errors.quantity = "Quantity must be a non-negative integer.";

  form.querySelectorAll(".form-error").forEach((el) => {
    el.textContent = "";
  });

  Object.keys(errors).forEach((key) => {
    const errEl = form.querySelector(`[data-error-for="${key}"]`);
    if (errEl) errEl.textContent = errors[key];
  });

  if (Object.keys(errors).length) {
    return null;
  }

  return {
    name,
    sku,
    category,
    supplier,
    price,
    quantity,
    lowStockThreshold,
    status,
    description,
  };
}

function openProductModal(productId) {
  const existing = productsState.all.find((p) => String(p.id) === String(productId));
  const isEdit = !!existing;

  const form = buildProductForm(existing || {});

  openModal({
    title: isEdit ? "Edit Product" : "Add Product",
    body: form,
    footerButtons: [
      {
        label: "Cancel",
        className: "btn btn-outline",
        onClick: () => closeModal(),
      },
      {
        label: isEdit ? "Save Changes" : "Create Product",
        className: "btn btn-primary",
        onClick: () => {
          const payload = collectProductFormData();
          if (!payload) return;

          if (isEdit) {
            Object.assign(existing, payload);
            showAlert("success", "Product updated (demo only, not persisted).");
          } else {
            productsState.all.push({
              id: `P-${Math.floor(Math.random() * 9000) + 1000}`,
              ...payload,
            });
            showAlert("success", "Product created (demo only, not persisted).");
          }

          closeModal();
          applyProductsFilter();
        },
      },
    ],
  });
}

window.onEditProduct = function onEditProduct(id) {
  openProductModal(id);
};

window.onDeleteProduct = function onDeleteProduct(id) {
  const product = productsState.all.find((p) => String(p.id) === String(id));
  confirmAction({
    title: "Delete product?",
    message: `You are about to delete product "${product?.name || id}". This is a demo-only operation.`,
    onConfirm: () => {
      productsState.all = productsState.all.filter((p) => String(p.id) !== String(id));
      showAlert("success", "Product removed from demo list.");
      applyProductsFilter();
    },
  });
};

