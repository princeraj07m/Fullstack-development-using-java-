// Categories page: static demo UI with in-memory data only

const categoriesState = {
  all: [
    {
      id: "C-01",
      name: "Electronics",
      description: "Laptops, monitors, peripherals and accessories.",
      productCount: 48,
    },
    {
      id: "C-02",
      name: "Furniture",
      description: "Office desks, chairs and storage.",
      productCount: 17,
    },
    {
      id: "C-03",
      name: "Stationery",
      description: "Daily consumables such as pens, pads and files.",
      productCount: 92,
    },
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page !== "categories") return;

  const addBtn = document.getElementById("btn-add-category");
  if (addBtn) addBtn.addEventListener("click", () => openCategoryModal());

  renderCategoriesTable();
});

function renderCategoriesTable() {
  const tbody = document.getElementById("categories-table-body");
  if (!tbody) return;

  if (!categoriesState.all.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-muted">No categories defined yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = categoriesState.all
    .map((c) => {
      return `
        <tr data-id="${c.id}">
          <td>${c.id}</td>
          <td>${c.name || "-"}</td>
          <td>${c.description || "-"}</td>
          <td class="text-right">${c.productCount ?? 0}</td>
          <td class="text-right">
            <button class="btn btn-sm btn-outline" onclick="onEditCategory('${c.id}')">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="onDeleteCategory('${c.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function buildCategoryForm(data = {}) {
  const form = document.createElement("form");
  form.id = "category-form";
  form.innerHTML = `
    <div class="form-control">
      <label for="category-name">Name</label>
      <input id="category-name" name="name" required maxlength="80" value="${data.name || ""}" />
      <div class="form-error" data-error-for="name"></div>
    </div>
    <div class="form-control">
      <label for="category-description">Description</label>
      <textarea id="category-description" name="description" rows="2" maxlength="250">${
        data.description || ""
      }</textarea>
      <div class="form-error" data-error-for="description"></div>
    </div>
  `;
  return form;
}

function collectCategoryFormData() {
  const form = document.getElementById("category-form");
  const errors = {};
  const name = form.name.value.trim();
  const description = form.description.value.trim();

  if (!name) errors.name = "Name is required.";

  form.querySelectorAll(".form-error").forEach((el) => (el.textContent = ""));
  Object.keys(errors).forEach((key) => {
    const el = form.querySelector(`[data-error-for="${key}"]`);
    if (el) el.textContent = errors[key];
  });

  if (Object.keys(errors).length) return null;
  return { name, description };
}

function openCategoryModal(categoryId) {
  const existing = categoriesState.all.find((c) => String(c.id) === String(categoryId));
  const isEdit = !!existing;
  const form = buildCategoryForm(existing || {});

  openModal({
    title: isEdit ? "Edit Category" : "Add Category",
    body: form,
    footerButtons: [
      {
        label: "Cancel",
        className: "btn btn-outline",
        onClick: () => closeModal(),
      },
      {
        label: isEdit ? "Save Changes" : "Create Category",
        className: "btn btn-primary",
        onClick: () => {
          const payload = collectCategoryFormData();
          if (!payload) return;

          if (isEdit) {
            Object.assign(existing, payload);
            showAlert("success", "Category updated (demo only).");
          } else {
            categoriesState.all.push({
              id: `C-${Math.floor(Math.random() * 90) + 10}`,
              productCount: 0,
              ...payload,
            });
            showAlert("success", "Category created (demo only).");
          }

          closeModal();
          renderCategoriesTable();
        },
      },
    ],
  });
}

window.onEditCategory = function onEditCategory(id) {
  openCategoryModal(id);
};

window.onDeleteCategory = function onDeleteCategory(id) {
  const category = categoriesState.all.find((c) => String(c.id) === String(id));
  confirmAction({
    title: "Delete category?",
    message: `You are about to delete category "${category?.name || id}". This is a demo-only change.`,
    onConfirm: () => {
      categoriesState.all = categoriesState.all.filter((c) => String(c.id) !== String(id));
      showAlert("success", "Category removed from demo list.");
      renderCategoriesTable();
    },
  });
};

