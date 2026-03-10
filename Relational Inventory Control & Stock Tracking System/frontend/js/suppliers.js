// Suppliers page: static demo UI with in-memory data only

let suppliersState = {
  all: [
    {
      id: "S-01",
      name: "TechSource",
      contactPerson: "Arjun Mehta",
      phone: "+91 98765 11111",
      email: "sales@techsource.example",
      city: "Bengaluru",
      country: "India",
      notes: "Primary IT hardware supplier.",
    },
    {
      id: "S-02",
      name: "ComfortWorks",
      contactPerson: "Priya Rao",
      phone: "+91 98765 22222",
      email: "support@comfortworks.example",
      city: "Mumbai",
      country: "India",
      notes: "Office furniture partner.",
    },
    {
      id: "S-03",
      name: "CableMart",
      contactPerson: "Rohit Shah",
      phone: "+91 98765 33333",
      email: "orders@cablemart.example",
      city: "Pune",
      country: "India",
      notes: "Cables and accessories.",
    },
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page !== "suppliers") return;

  const addBtn = document.getElementById("btn-add-supplier");
  if (addBtn) addBtn.addEventListener("click", () => openSupplierModal());

  renderSuppliersTable();
});

function renderSuppliersTable() {
  const tbody = document.getElementById("suppliers-table-body");
  if (!tbody) return;

  if (!suppliersState.all.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-muted">No suppliers added yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = suppliersState.all
    .map((s) => {
      return `
        <tr data-id="${s.id}">
          <td>${s.id}</td>
          <td>${s.name || "-"}</td>
          <td>${s.contactPerson || "-"}</td>
          <td>${s.phone || "-"}</td>
          <td>${s.email || "-"}</td>
          <td>${s.city || "-"}</td>
          <td class="text-right">
            <button class="btn btn-sm btn-outline" onclick="onEditSupplier('${s.id}')">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="onDeleteSupplier('${s.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function buildSupplierForm(data = {}) {
  const form = document.createElement("form");
  form.id = "supplier-form";
  form.innerHTML = `
    <div class="form-row">
      <div class="form-control">
        <label for="supplier-name">Name</label>
        <input id="supplier-name" name="name" required maxlength="120" value="${data.name || ""}" />
        <div class="form-error" data-error-for="name"></div>
      </div>
      <div class="form-control">
        <label for="supplier-contact">Contact Person</label>
        <input id="supplier-contact" name="contactPerson" maxlength="80" value="${data.contactPerson || ""}" />
        <div class="form-error" data-error-for="contactPerson"></div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-control">
        <label for="supplier-email">Email</label>
        <input id="supplier-email" name="email" type="email" maxlength="120" value="${data.email || ""}" />
        <div class="form-error" data-error-for="email"></div>
      </div>
      <div class="form-control">
        <label for="supplier-phone">Phone</label>
        <input id="supplier-phone" name="phone" maxlength="40" value="${data.phone || ""}" />
        <div class="form-error" data-error-for="phone"></div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-control">
        <label for="supplier-city">City</label>
        <input id="supplier-city" name="city" maxlength="80" value="${data.city || ""}" />
        <div class="form-error" data-error-for="city"></div>
      </div>
      <div class="form-control">
        <label for="supplier-country">Country</label>
        <input id="supplier-country" name="country" maxlength="80" value="${data.country || ""}" />
        <div class="form-error" data-error-for="country"></div>
      </div>
    </div>
    <div class="form-control">
      <label for="supplier-notes">Notes</label>
      <textarea id="supplier-notes" name="notes" rows="2" maxlength="300">${
        data.notes || ""
      }</textarea>
      <div class="form-error" data-error-for="notes"></div>
    </div>
  `;
  return form;
}

function collectSupplierFormData() {
  const form = document.getElementById("supplier-form");
  const errors = {};

  const name = form.name.value.trim();
  const contactPerson = form.contactPerson.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const city = form.city.value.trim();
  const country = form.country.value.trim();
  const notes = form.notes.value.trim();

  if (!name) errors.name = "Name is required.";
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errors.email = "Enter a valid email.";
  }

  form.querySelectorAll(".form-error").forEach((el) => (el.textContent = ""));
  Object.keys(errors).forEach((key) => {
    const el = form.querySelector(`[data-error-for="${key}"]`);
    if (el) el.textContent = errors[key];
  });

  if (Object.keys(errors).length) return null;

  return { name, contactPerson, email, phone, city, country, notes };
}

function openSupplierModal(id) {
  const existing = suppliersState.all.find((s) => String(s.id) === String(id));
  const isEdit = !!existing;
  const form = buildSupplierForm(existing || {});

  openModal({
    title: isEdit ? "Edit Supplier" : "Add Supplier",
    body: form,
    footerButtons: [
      {
        label: "Cancel",
        className: "btn btn-outline",
        onClick: () => closeModal(),
      },
      {
        label: isEdit ? "Save Changes" : "Create Supplier",
        className: "btn btn-primary",
        onClick: () => {
          const payload = collectSupplierFormData();
          if (!payload) return;

          if (isEdit) {
            Object.assign(existing, payload);
            showAlert("success", "Supplier updated (demo only).");
          } else {
            suppliersState.all.push({
              id: `S-${Math.floor(Math.random() * 90) + 10}`,
              ...payload,
            });
            showAlert("success", "Supplier created (demo only).");
          }

          closeModal();
          renderSuppliersTable();
        },
      },
    ],
  });
}

window.onEditSupplier = function onEditSupplier(id) {
  openSupplierModal(id);
};

window.onDeleteSupplier = function onDeleteSupplier(id) {
  const supplier = suppliersState.all.find((s) => String(s.id) === String(id));
  confirmAction({
    title: "Delete supplier?",
    message: `You are about to delete supplier "${supplier?.name || id}". This is a demo-only change.`,
    onConfirm: () => {
      suppliersState.all = suppliersState.all.filter((s) => String(s.id) !== String(id));
      showAlert("success", "Supplier removed from demo list.");
      renderSuppliersTable();
    },
  });
};

