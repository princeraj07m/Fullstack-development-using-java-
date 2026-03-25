/* Inventory Pro - Vanilla JS App */
const API_BASE = "http://localhost:4000";

const state = {
  activeSection: "dashboard",
  user: null, // { id, name, email }
  products: [],
  suppliers: [],
  customers: [],
  transactions: [],
  categories: [],
  alerts: [],
};

function $(sel, el = document) {
  return el.querySelector(sel);
}
function $$(sel, el = document) {
  return Array.from(el.querySelectorAll(sel));
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  // If logged in, send user id so backend can scope data per user if needed.
  if (state.user?.id) {
    headers["X-User-Id"] = String(state.user.id);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function loadAll() {
  try {
    const [products, suppliers, customers, transactions, categories, alerts] = await Promise.all([
      api("/api/products"),
      api("/api/suppliers"),
      api("/api/customers"),
      api("/api/transactions"),
      api("/api/categories"),
      api("/api/alerts"),
    ]);
    state.products = products.map((p) => ({ ...p, quantity: Number(p.quantity), reorderPoint: Number(p.reorderPoint), price: Number(p.price) }));
    state.suppliers = suppliers;
    state.customers = customers;
    state.transactions = transactions.map((t) => ({ ...t, quantity: Number(t.quantity), unitPrice: Number(t.unitPrice), total: Number(t.total) }));
    state.categories = categories.map((c) => ({ ...c, subcategories: c.subcategories ? c.subcategories.split(",").filter(Boolean) : [] }));
    state.alerts = alerts;
    updateStatusBar();
    return true;
  } catch (e) {
    console.error("Load failed", e);
    return false;
  }
}

function updateStatusBar() {
  const skuEl = $("#statusSkus");
  const catEl = $("#statusCats");
  const alertEl = $("#statusAlerts");
  if (skuEl) skuEl.textContent = state.products.length;
  if (catEl) catEl.textContent = state.categories.length;
  if (alertEl) alertEl.textContent = state.alerts.filter((a) => a.status === "active").length;
  const lastEl = $("#lastUpdate");
  if (lastEl) lastEl.textContent = new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " UTC";

  const userEl = $("#toolbarUser");
  if (userEl) {
    if (state.user) {
      userEl.textContent = `USER: ${state.user.name} (${state.user.email})`;
    } else {
      userEl.textContent = "NOT LOGGED IN";
    }
  }
}

function renderPage() {
  const content = $("#content");
  if (!content) return;
  const section = state.activeSection;
  const titles = { dashboard: "DASHBOARD", products: "PRODUCTS", suppliers: "SUPPLIERS", customers: "CUSTOMERS", transactions: "TRANSACTIONS", categories: "CATEGORIES", alerts: "ALERTS" };
  const toolbarSection = $("#toolbarSection");
  if (toolbarSection) toolbarSection.textContent = titles[section] || section.toUpperCase();

  if (section === "dashboard") content.innerHTML = renderDashboard();
  else if (section === "products") content.innerHTML = renderProducts();
  else if (section === "suppliers") content.innerHTML = renderSuppliers();
  else if (section === "customers") content.innerHTML = renderCustomers();
  else if (section === "transactions") content.innerHTML = renderTransactions();
  else if (section === "categories") content.innerHTML = renderCategories();
  else if (section === "alerts") content.innerHTML = renderAlerts();
  else content.innerHTML = "<p>Unknown section</p>";

  bindPageEvents();
}

function renderDashboard() {
  const p = state.products;
  const t = state.transactions;
  const c = state.categories;
  const a = state.alerts;
  const totalSkus = p.length;
  const optimal = p.filter((x) => x.status === "optimal").length;
  const low = p.filter((x) => x.status === "low").length;
  const critical = p.filter((x) => x.status === "critical").length;
  const totalValue = p.reduce((s, x) => s + (x.quantity || 0) * (x.price || 0), 0);
  const recent = t.slice(0, 5);
  const totalItems = c.reduce((s, x) => s + (x.itemCount || 0), 0);
  const breakdown = c.map((cat) => ({ name: cat.name, percent: totalItems ? Math.round(((cat.itemCount || 0) / totalItems) * 100) : 0 }));
  const colors = ["#f97316", "#fff", "#ef4444", "#10b981"];

  let stockRows = p.slice(0, 4).map((item) => {
    const dot = item.status === "optimal" ? "bg-white" : item.status === "low" ? "bg-orange-500" : "bg-red-500";
    return `<div class="flex items-center justify-between p-2 bg-neutral-800 rounded" style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem;background:var(--bg-neutral-800);border-radius:6px;margin-bottom:0.5rem;">
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <div class="w-2 h-2 rounded-full ${dot}" style="width:8px;height:8px;border-radius:50%;background:${item.status === "optimal" ? "#fff" : item.status === "low" ? "var(--orange-500)" : "var(--red-500)"};"></div>
        <div><div class="text-xs font-mono" style="font-size:0.75rem;">${escapeHtml(item.sku)}</div><div class="text-xs text-neutral-500" style="font-size:0.75rem;color:var(--text-neutral-500);">${escapeHtml(item.name)}</div></div>
      </div>
      <div class="text-xs font-mono" style="font-size:0.75rem;">${item.quantity} units</div>
    </div>`;
  }).join("");

  let recentHtml = recent.map((log) => {
    const typeCl = log.type === "in" ? "text-green-400" : log.type === "out" ? "text-orange-500" : "text-blue-400";
    return `<div class="text-xs border-l-2 pl-3" style="border-left:2px solid var(--orange-500);padding-left:0.75rem;margin-bottom:0.75rem;">
      <div style="color:var(--text-neutral-500);font-family:monospace;">${escapeHtml(log.date)}</div>
      <div><span class="${typeCl}" style="color:${log.type === "in" ? "var(--green-400)" : log.type === "out" ? "var(--orange-500)" : "var(--blue-400)"};">${(log.type || "").toUpperCase()}</span> ${log.quantity} units of <span style="font-family:monospace;">${escapeHtml(log.product)}</span>
      <div style="color:var(--text-neutral-400);font-size:0.75rem;margin-top:0.25rem;">${escapeHtml(log.reference || "")}</div></div>
    </div>`;
  }).join("");

  let breakdownHtml = breakdown.map((cat, i) => {
    const col = colors[i % colors.length];
    return `<div class="flex justify-between items-center" style="display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:var(--text-neutral-400);">
      <span style="display:flex;align-items:center;gap:0.5rem;"><div style="width:8px;height:8px;border-radius:50%;background:${col};"></div>${escapeHtml(cat.name)}</span>
      <span>${cat.percent}%</span>
    </div>`;
  }).join("");

  return `
    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header"><div class="card-title">STOCK SUMMARY</div></div>
        <div class="card-content">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;">
            <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;">${totalSkus}</div><div style="font-size:0.75rem;color:var(--text-neutral-500);">Total SKUs</div></div>
            <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;">${optimal}</div><div style="font-size:0.75rem;color:var(--text-neutral-500);">In Stock</div></div>
            <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--orange-500);">${low}</div><div style="font-size:0.75rem;color:var(--text-neutral-500);">Low Stock</div></div>
          </div>
          <div>${stockRows}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">RECENT ACTIVITY</div></div>
        <div class="card-content" style="max-height:20rem;overflow-y:auto;">${recentHtml || "<p style='color:var(--text-neutral-500);'>No recent activity</p>"}</div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">CATEGORY BREAKDOWN</div></div>
        <div class="card-content">
          <div style="text-align:center;margin-bottom:1rem;"><div style="font-size:1rem;font-weight:700;">${totalItems}</div><div style="font-size:0.75rem;color:var(--text-neutral-400);">items</div></div>
          <div class="category-breakdown">${breakdownHtml || "<p style='color:var(--text-neutral-500);'>No categories</p>"}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">MONTHLY INVENTORY TURNOVER</div></div>
        <div class="card-content"><div style="height:12rem;background:var(--bg-neutral-800);border-radius:6px;"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">KEY METRICS</div></div>
        <div class="card-content">
          <div style="margin-bottom:1rem;"><div style="font-size:0.75rem;margin-bottom:0.5rem;">Reorder Items</div>
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;"><span style="color:var(--text-neutral-400);">Critical</span><span style="color:var(--red-500);font-weight:700;">${critical}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;"><span style="color:var(--text-neutral-400);">Low Stock</span><span style="color:var(--orange-500);font-weight:700;">${low}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;"><span style="color:var(--text-neutral-400);">Optimal</span><span style="font-weight:700;">${optimal}</span></div>
          </div>
          <div><div style="font-size:0.75rem;margin-bottom:0.5rem;color:var(--orange-500);">Quick Stats</div>
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;"><span style="color:var(--text-neutral-400);">Total Value</span><span style="font-weight:700;">$${(totalValue / 1000).toFixed(1)}K</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  if (s == null) return "";
  const div = document.createElement("div");
  div.textContent = String(s);
  return div.innerHTML;
}

function getStatusBadge(status, type = "product") {
  const map = { optimal: "badge-optimal", low: "badge-low", critical: "badge-critical", active: "badge-active", "on-hold": "badge-on-hold", inactive: "badge-inactive" };
  const c = map[status] || "badge-inactive";
  return `<span class="badge ${c}">${(status || "").toUpperCase()}</span>`;
}

function renderProducts() {
  const search = (state._productsSearch || "").toLowerCase();
  const list = state.products.filter((p) => !search || (p.name || "").toLowerCase().includes(search) || (p.sku || "").toLowerCase().includes(search) || (p.id || "").toLowerCase().includes(search));
  const total = state.products.length;
  const optimal = state.products.filter((p) => p.status === "optimal").length;
  const low = state.products.filter((p) => p.status === "low").length;
  const critical = state.products.filter((p) => p.status === "critical").length;

  const rows = list.map((p, i) => `
    <tr data-id="${escapeHtml(p.id)}" data-type="product" class="row-product">
      <td>${escapeHtml(p.sku)}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${p.quantity}</td>
      <td>${p.reorderPoint}</td>
      <td>${getStatusBadge(p.status)}</td>
      <td>${escapeHtml(p.location)}</td>
      <td>$${p.price}</td>
    </tr>
  `).join("");

  return `
    <div class="page-header">
      <div><h1 class="page-title">PRODUCT INVENTORY</h1><p class="page-subtitle">Manage all products and stock levels</p></div>
      <div class="page-actions"><button type="button" class="btn btn-primary" data-action="product-create">Add Product</button><button type="button" class="btn btn-primary">Export List</button></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div><div class="stat-label">TOTAL PRODUCTS</div><div class="stat-value">${total}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">OPTIMAL STOCK</div><div class="stat-value">${optimal}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">LOW STOCK</div><div class="stat-value" style="color:var(--orange-500);">${low}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">CRITICAL</div><div class="stat-value" style="color:var(--red-500);">${critical}</div></div></div>
    </div>
    <div class="search-box"><div class="search-wrapper"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" class="search-input" data-search="products" placeholder="Search products..." value="${escapeHtml(state._productsSearch || "")}"></div></div>
    <div class="table-card"><div class="card-header"><div class="card-title">PRODUCT LIST</div></div><div class="table-wrapper"><table><thead><tr><th>SKU</th><th>PRODUCT NAME</th><th>CATEGORY</th><th>QUANTITY</th><th>REORDER</th><th>STATUS</th><th>LOCATION</th><th>PRICE</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  `;
}

function renderSuppliers() {
  const search = (state._suppliersSearch || "").toLowerCase();
  const list = state.suppliers.filter((s) => !search || (s.name || "").toLowerCase().includes(search) || (s.code || "").toLowerCase().includes(search) || String(s.id).toLowerCase().includes(search));
  const total = state.suppliers.length;
  const active = state.suppliers.filter((s) => s.status === "active").length;
  const onHold = state.suppliers.filter((s) => s.status === "on-hold").length;
  const avgLead = state.suppliers.length ? Math.round(state.suppliers.reduce((a, s) => a + (s.leadTimeDays || 0), 0) / state.suppliers.length) : 0;

  const rows = list.map((s) => `
    <tr data-id="${s.id}" data-type="supplier" class="row-supplier">
      <td>${escapeHtml(s.code)}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.contactName)}</td>
      <td>${escapeHtml(s.phone)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${getStatusBadge(s.status)}</td>
      <td>${s.leadTimeDays} days</td>
      <td>$${(s.totalSpend || 0).toLocaleString()}</td>
    </tr>
  `).join("");

  return `
    <div class="page-header">
      <div><h1 class="page-title">SUPPLIERS</h1><p class="page-subtitle">Manage all vendors providing stock to your warehouses</p></div>
      <div class="page-actions"><button type="button" class="btn btn-primary" data-action="supplier-create">Add Supplier</button><button type="button" class="btn btn-primary">Export List</button></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div><div class="stat-label">TOTAL SUPPLIERS</div><div class="stat-value">${total}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">ACTIVE</div><div class="stat-value" style="color:var(--green-400);">${active}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">ON HOLD</div><div class="stat-value" style="color:var(--orange-500);">${onHold}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">AVG LEAD TIME</div><div class="stat-value">${avgLead} days</div></div></div>
    </div>
    <div class="search-box"><div class="search-wrapper"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" class="search-input" data-search="suppliers" placeholder="Search suppliers..." value="${escapeHtml(state._suppliersSearch || "")}"></div></div>
    <div class="table-card"><div class="card-header"><div class="card-title">SUPPLIER LIST</div></div><div class="table-wrapper"><table><thead><tr><th>CODE</th><th>SUPPLIER NAME</th><th>CONTACT</th><th>PHONE</th><th>EMAIL</th><th>STATUS</th><th>LEAD TIME</th><th>TOTAL SPEND</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  `;
}

function renderCustomers() {
  const search = (state._customersSearch || "").toLowerCase();
  const list = state.customers.filter((c) => !search || (c.name || "").toLowerCase().includes(search) || (c.code || "").toLowerCase().includes(search) || String(c.id).toLowerCase().includes(search));
  const total = state.customers.length;
  const active = state.customers.filter((c) => c.status === "active").length;
  const highValue = state.customers.filter((c) => (c.totalRevenue || 0) > 500000).length;
  const totalRev = state.customers.reduce((a, c) => a + (c.totalRevenue || 0), 0);

  const rows = list.map((c) => `
    <tr data-id="${c.id}" data-type="customer" class="row-customer">
      <td>${escapeHtml(c.code)}</td>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.type)}</td>
      <td>${escapeHtml(c.location)}</td>
      <td>${escapeHtml(c.lastOrderDate)}</td>
      <td>${c.totalOrders || 0}</td>
      <td>$${(c.totalRevenue || 0).toLocaleString()}</td>
      <td>${getStatusBadge(c.status)}</td>
    </tr>
  `).join("");

  return `
    <div class="page-header">
      <div><h1 class="page-title">CUSTOMERS</h1><p class="page-subtitle">Track customers linked to inventory movements and orders</p></div>
      <div class="page-actions"><button type="button" class="btn btn-primary" data-action="customer-create">Add Customer</button><button type="button" class="btn btn-primary">Export List</button></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div><div class="stat-label">TOTAL CUSTOMERS</div><div class="stat-value">${total}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">ACTIVE</div><div class="stat-value" style="color:var(--green-400);">${active}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">HIGH VALUE</div><div class="stat-value" style="color:var(--orange-500);">${highValue}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">TOTAL REVENUE</div><div class="stat-value">$${(totalRev / 1000).toFixed(1)}K</div></div></div>
    </div>
    <div class="search-box"><div class="search-wrapper"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" class="search-input" data-search="customers" placeholder="Search customers..." value="${escapeHtml(state._customersSearch || "")}"></div></div>
    <div class="table-card"><div class="card-header"><div class="card-title">CUSTOMER LIST</div></div><div class="table-wrapper"><table><thead><tr><th>CODE</th><th>CUSTOMER NAME</th><th>TYPE</th><th>LOCATION</th><th>LAST ORDER</th><th>ORDERS</th><th>REVENUE</th><th>STATUS</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  `;
}

function renderTransactions() {
  const search = (state._transactionsSearch || "").toLowerCase();
  const list = state.transactions.filter((t) => !search || (t.reference || "").toLowerCase().includes(search) || (t.product || "").toLowerCase().includes(search) || (t.id || "").toLowerCase().includes(search));
  const inCount = state.transactions.filter((t) => t.type === "in").length;
  const outCount = state.transactions.filter((t) => t.type === "out").length;

  const rows = list.map((t) => `
    <tr data-id="${escapeHtml(t.id)}" data-type="transaction" class="row-transaction">
      <td>${escapeHtml(t.id)}</td>
      <td>${escapeHtml(t.date)}</td>
      <td><span class="badge ${t.type === "in" ? "badge-active" : "badge-warning"}">${(t.type || "").toUpperCase()}</span></td>
      <td>${escapeHtml(t.product)}</td>
      <td>${escapeHtml(t.reference)}</td>
      <td>${t.quantity}</td>
      <td>$${(t.unitPrice || 0).toFixed(2)}</td>
      <td>$${(t.total || 0).toFixed(2)}</td>
    </tr>
  `).join("");

  return `
    <div class="page-header">
      <div><h1 class="page-title">TRANSACTIONS</h1><p class="page-subtitle">Record and track inventory movements</p></div>
      <div class="page-actions"><button type="button" class="btn btn-primary" data-action="transaction-create">Record Transaction</button></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div><div class="stat-label">TOTAL</div><div class="stat-value">${state.transactions.length}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">IN</div><div class="stat-value" style="color:var(--green-400);">${inCount}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">OUT</div><div class="stat-value" style="color:var(--orange-500);">${outCount}</div></div></div>
    </div>
    <div class="search-box"><div class="search-wrapper"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" class="search-input" data-search="transactions" placeholder="Search transactions..." value="${escapeHtml(state._transactionsSearch || "")}"></div></div>
    <div class="table-card"><div class="card-header"><div class="card-title">TRANSACTION LIST</div></div><div class="table-wrapper"><table><thead><tr><th>CODE</th><th>DATE</th><th>TYPE</th><th>PRODUCT</th><th>REFERENCE</th><th>QTY</th><th>UNIT PRICE</th><th>TOTAL</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  `;
}

function renderCategories() {
  const totalItems = state.categories.reduce((s, c) => s + (c.itemCount || 0), 0);
  const totalValue = state.categories.reduce((s, c) => s + (c.totalValue || 0), 0);
  const cards = state.categories.map((c) => `
    <div class="card" style="cursor:pointer;" data-id="${c.id}" data-type="category">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div><div class="card-title">${escapeHtml(c.name)}</div><div style="font-size:0.75rem;color:var(--text-neutral-400);">${escapeHtml(c.code)}</div></div>
        <span class="badge badge-active">${(c.status || "active").toUpperCase()}</span>
      </div>
      <div class="card-content">
        <p style="font-size:0.875rem;color:var(--text-neutral-300);margin-bottom:1rem;">${escapeHtml(c.description)}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
          <div><div style="font-size:0.75rem;color:var(--text-neutral-400);">ITEMS</div><div style="font-size:1.25rem;font-weight:700;">${c.itemCount || 0}</div></div>
          <div><div style="font-size:0.75rem;color:var(--text-neutral-400);">VALUE</div><div style="font-size:1.25rem;font-weight:700;">$${((c.totalValue || 0) / 1000).toFixed(1)}K</div></div>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${(c.subcategories || []).map((s) => `<span class="badge badge-inactive">${escapeHtml(s)}</span>`).join("")}
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-neutral-700);">
          <button type="button" class="btn btn-primary btn-sm" data-action="category-edit" data-id="${c.id}">Edit</button>
          <button type="button" class="btn btn-outline danger btn-sm" data-action="category-delete" data-id="${c.id}">Delete</button>
        </div>
      </div>
    </div>
  `).join("");

  return `
    <div class="page-header">
      <div><h1 class="page-title">PRODUCT CATEGORIES</h1><p class="page-subtitle">Organize and manage product categories</p></div>
      <div class="page-actions"><button type="button" class="btn btn-primary" data-action="category-create">New Category</button></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div><div class="stat-label">TOTAL CATEGORIES</div><div class="stat-value">${state.categories.length}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">TOTAL PRODUCTS</div><div class="stat-value">${totalItems}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">INVENTORY VALUE</div><div class="stat-value" style="color:var(--orange-500);">$${(totalValue / 1000).toFixed(0)}K</div></div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;">${cards}</div>
  `;
}

function renderAlerts() {
  const active = state.alerts.filter((a) => a.status === "active");
  const ack = state.alerts.filter((a) => a.status === "acknowledged");
  const resolved = state.alerts.filter((a) => a.status === "resolved");
  const getBadge = (t) => t === "critical" ? "badge-critical-alt" : t === "warning" ? "badge-warning" : "badge-info";
  const getStatusBadge = (s) => s === "active" ? "badge-critical-alt" : s === "acknowledged" ? "badge-acknowledged" : "badge-resolved";

  const activeHtml = active.map((a) => `
    <div class="alert-item" data-id="${escapeHtml(a.id)}" data-type="alert">
      <div class="alert-item-content">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;"><strong>${escapeHtml(a.product)}</strong><span style="font-size:0.75rem;color:var(--text-neutral-400);">${escapeHtml(a.sku)}</span></div>
        <p style="font-size:0.875rem;color:var(--text-neutral-300);margin-bottom:0.5rem;">${escapeHtml(a.message)}</p>
        <div style="font-size:0.75rem;color:var(--text-neutral-500);">Current: ${a.current} / Threshold: ${a.threshold}</div>
      </div>
      <div class="alert-item-actions">
        <span class="badge ${getBadge(a.type)}">${(a.type || "").toUpperCase()}</span>
        <span style="font-size:0.75rem;color:var(--text-neutral-500);">${escapeHtml(a.date)}</span>
        <button type="button" class="btn btn-primary btn-sm" data-action="alert-ack" data-id="${a.id}">Acknowledge</button>
        <button type="button" class="btn btn-outline danger btn-sm" data-action="alert-delete" data-id="${a.id}">Delete</button>
      </div>
    </div>
  `).join("");

  const ackHtml = ack.map((a) => `
    <div class="alert-item" data-id="${escapeHtml(a.id)}" data-type="alert" style="opacity:0.8;">
      <div class="alert-item-content">
        <div style="display:flex;align-items:center;gap:0.5rem;"><strong>${escapeHtml(a.product)}</strong><span style="font-size:0.75rem;">${escapeHtml(a.sku)}</span></div>
        <p style="font-size:0.875rem;">${escapeHtml(a.message)}</p>
      </div>
      <span class="badge badge-acknowledged">ACKNOWLEDGED</span>
    </div>
  `).join("");

  return `
    <div class="page-header">
      <div><h1 class="page-title">INVENTORY ALERTS</h1><p class="page-subtitle">Low stock warnings and system notifications</p></div>
      <div class="page-actions"><button type="button" class="btn btn-primary" data-action="alert-create">New Alert</button><button type="button" class="btn btn-primary" data-action="alert-clear">Clear All</button></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div><div class="stat-label">TOTAL ALERTS</div><div class="stat-value">${state.alerts.length}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">ACTIVE</div><div class="stat-value" style="color:var(--red-500);">${active.length}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">ACKNOWLEDGED</div><div class="stat-value" style="color:var(--orange-500);">${ack.length}</div></div></div>
      <div class="stat-card"><div><div class="stat-label">RESOLVED</div><div class="stat-value" style="color:var(--green-400);">${resolved.length}</div></div></div>
    </div>
    <div class="card" style="margin-bottom:1.5rem;"><div class="card-header"><div class="card-title">ACTIVE ALERTS</div></div><div class="card-content">${activeHtml || "<p style='color:var(--text-neutral-500);text-align:center;margin:2rem 0;'>No active alerts</p>"}</div></div>
    ${ack.length ? `<div class="card"><div class="card-header"><div class="card-title">ACKNOWLEDGED</div></div><div class="card-content">${ackHtml}</div></div>` : ""}
  `;
}

function bindPageEvents() {
  const content = $("#content");
  if (!content) return;

  $$("[data-search]", content).forEach((inp) => {
    inp.oninput = () => {
      state["_" + inp.dataset.search + "Search"] = inp.value;
      renderPage();
    };
  });

  content.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (btn) {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === "product-create") openProductForm();
      else if (action === "supplier-create") openSupplierForm();
      else if (action === "customer-create") openCustomerForm();
      else if (action === "transaction-create") openTransactionForm();
      else if (action === "category-create") openCategoryForm();
      else if (action === "category-edit" && id) openCategoryForm(state.categories.find((c) => String(c.id) === id));
      else if (action === "category-delete" && id) confirmDelete("category", state.categories.find((c) => String(c.id) === id));
      else if (action === "alert-create") openAlertForm();
      else if (action === "alert-ack" && id) updateAlertStatus(id, "acknowledged");
      else if (action === "alert-delete" && id) deleteAlert(id);
      else if (action === "alert-clear") clearAllAlerts();
      return;
    }

    const row = e.target.closest("tr[data-type]");
    if (row) {
      const type = row.dataset.type;
      const id = row.dataset.id;
      if (type === "product") showProductModal(state.products.find((p) => String(p.id) === String(id)));
      else if (type === "supplier") showSupplierModal(state.suppliers.find((s) => String(s.id) === id));
      else if (type === "customer") showCustomerModal(state.customers.find((c) => String(c.id) === id));
      else if (type === "transaction") showTransactionModal(state.transactions.find((t) => String(t.id) === String(id)));
    }

    const card = e.target.closest(".card[data-type='category']");
    if (card) openCategoryForm(state.categories.find((c) => String(c.id) === card.dataset.id));
  });
}

function showModal(title, bodyHtml, footerHtml) {
  const modals = $("#modals");
  if (!modals) return;
  modals.innerHTML = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${title}</div>
          <button type="button" class="modal-close" data-modal-close>&times;</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ""}
      </div>
    </div>
  `;
  const overlay = document.getElementById("modalOverlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("[data-modal-close]")) {
        modals.innerHTML = "";
      }
    });
  }
}

function openLoginModal() {
  showModal(
    "LOGIN",
    `
    <div id="loginError"></div>
    <div class="form-grid">
      <div class="form-group span-2">
        <label class="form-label">Email</label>
        <input type="email" class="form-input" id="login_email" placeholder="you@mail.com" />
      </div>
      <div class="form-group span-2">
        <label class="form-label">Password</label>
        <input type="password" class="form-input" id="login_password" placeholder="••••••••" />
      </div>
    </div>
  `,
    `
    <button type="button" class="btn btn-outline" data-modal-close>Cancel</button>
    <button type="button" class="btn btn-primary" id="loginSubmitBtn">Login</button>
  `,
  );

  const submitBtn = document.getElementById("loginSubmitBtn");
  if (submitBtn) {
    submitBtn.onclick = async () => {
      const email = document.getElementById("login_email").value.trim();
      const password = document.getElementById("login_password").value.trim();
      if (!email || !password) {
        document.getElementById("loginError").innerHTML = '<div class="alert-error">Email and password are required</div>';
        return;
      }
      try {
        const user = await api("/api/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        state.user = user;
        try {
          window.localStorage.setItem("inventoryProUser", JSON.stringify(user));
        } catch (_) {
          // ignore storage errors
        }
        updateStatusBar();
        $("#modals").innerHTML = "";
        await loadAll();
        renderPage();
      } catch (e) {
        document.getElementById("loginError").innerHTML = '<div class="alert-error">' + escapeHtml(e.message) + "</div>";
      }
    };
  }
}

function showProductModal(p) {
  if (!p) return;
  const footer = `
    <button type="button" class="btn btn-primary" data-edit-product="${p.id}">Edit Product</button>
    <button type="button" class="btn btn-outline danger" data-delete-product="${p.id}">Delete</button>
    <button type="button" class="btn btn-outline" data-modal-close>Close</button>
  `;
  showModal(p.name + " (" + p.sku + ")", `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
      <div><div class="form-label">CURRENT STOCK</div><div style="font-size:1.5rem;font-weight:700;">${p.quantity}</div></div>
      <div><div class="form-label">REORDER POINT</div><div style="font-size:1.5rem;font-weight:700;color:var(--orange-500);">${p.reorderPoint}</div></div>
      <div><div class="form-label">LOCATION</div><div>${escapeHtml(p.location)}</div></div>
      <div><div class="form-label">UNIT PRICE</div><div>$${p.price}</div></div>
      <div><div class="form-label">STATUS</div>${getStatusBadge(p.status)}</div>
      <div><div class="form-label">LAST RESTOCKED</div><div>${escapeHtml(p.lastRestocked)}</div></div>
    </div>
  `, footer);
  $("#modals").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit-product], [data-delete-product]");
    if (!btn) return;
    const id = btn.dataset.editProduct || btn.dataset.deleteProduct;
    if (btn.dataset.editProduct) {
      const p = state.products.find((x) => String(x.id) === String(id));
      if (p) { openProductForm(p); $("#modals").innerHTML = ""; }
    } else if (btn.dataset.deleteProduct) {
      const p = state.products.find((x) => String(x.id) === String(id));
      if (p) confirmDelete("product", p);
    }
  }, { once: true });
}

function showSupplierModal(s) {
  if (!s) return;
  const footer = `
    <button type="button" class="btn btn-primary" data-edit-supplier="${s.id}">Edit</button>
    <button type="button" class="btn btn-outline danger" data-delete-supplier="${s.id}">Delete</button>
    <button type="button" class="btn btn-outline" data-modal-close>Close</button>
  `;
  showModal(s.name + " (" + s.code + ")", `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
      <div><div class="form-label">CONTACT</div><div>${escapeHtml(s.contactName)}</div></div>
      <div><div class="form-label">LOCATION</div><div>${escapeHtml(s.location)}</div></div>
      <div><div class="form-label">EMAIL</div><div>${escapeHtml(s.email)}</div></div>
      <div><div class="form-label">PHONE</div><div>${escapeHtml(s.phone)}</div></div>
      <div><div class="form-label">STATUS</div>${getStatusBadge(s.status)}</div>
      <div><div class="form-label">LEAD TIME</div><div style="font-size:1.25rem;font-weight:700;">${s.leadTimeDays} days</div></div>
      <div><div class="form-label">ON-TIME RATE</div><div style="font-size:1.25rem;font-weight:700;color:var(--orange-500);">${s.onTimeRate}%</div></div>
      <div><div class="form-label">TOTAL SPEND</div><div style="font-size:1.25rem;font-weight:700;">$${(s.totalSpend || 0).toLocaleString()}</div></div>
    </div>
  `, footer);
  $("#modals").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit-supplier], [data-delete-supplier]");
    if (!btn) return;
    const id = btn.dataset.editSupplier || btn.dataset.deleteSupplier;
    if (btn.dataset.editSupplier) {
      const s = state.suppliers.find((x) => String(x.id) === String(id));
      if (s) { openSupplierForm(s); $("#modals").innerHTML = ""; }
    } else if (btn.dataset.deleteSupplier) {
      const s = state.suppliers.find((x) => String(x.id) === String(id));
      if (s) confirmDelete("supplier", s);
    }
  }, { once: true });
}

function showCustomerModal(c) {
  if (!c) return;
  const footer = `
    <button type="button" class="btn btn-primary" data-edit-customer="${c.id}">Edit</button>
    <button type="button" class="btn btn-outline danger" data-delete-customer="${c.id}">Delete</button>
    <button type="button" class="btn btn-outline" data-modal-close>Close</button>
  `;
  showModal(c.name + " (" + c.code + ")", `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
      <div><div class="form-label">CONTACT</div><div>${escapeHtml(c.contactName)}</div></div>
      <div><div class="form-label">LOCATION</div><div>${escapeHtml(c.location)}</div></div>
      <div><div class="form-label">EMAIL</div><div>${escapeHtml(c.email)}</div></div>
      <div><div class="form-label">PHONE</div><div>${escapeHtml(c.phone)}</div></div>
      <div><div class="form-label">STATUS</div>${getStatusBadge(c.status)}</div>
      <div><div class="form-label">TOTAL ORDERS</div><div style="font-size:1.25rem;font-weight:700;">${c.totalOrders || 0}</div></div>
      <div><div class="form-label">TOTAL REVENUE</div><div style="font-size:1.25rem;font-weight:700;color:var(--orange-500);">$${(c.totalRevenue || 0).toLocaleString()}</div></div>
    </div>
  `, footer);
  $("#modals").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit-customer], [data-delete-customer]");
    if (!btn) return;
    const id = btn.dataset.editCustomer || btn.dataset.deleteCustomer;
    if (btn.dataset.editCustomer) {
      const c = state.customers.find((x) => String(x.id) === String(id));
      if (c) { openCustomerForm(c); $("#modals").innerHTML = ""; }
    } else if (btn.dataset.deleteCustomer) {
      const c = state.customers.find((x) => String(x.id) === String(id));
      if (c) confirmDelete("customer", c);
    }
  }, { once: true });
}

function showTransactionModal(t) {
  if (!t) return;
  showModal("Transaction " + t.id, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
      <div><div class="form-label">DATE</div><div>${escapeHtml(t.date)}</div></div>
      <div><div class="form-label">TYPE</div><span class="badge ${t.type === "in" ? "badge-active" : "badge-warning"}">${(t.type || "").toUpperCase()}</span></div>
      <div><div class="form-label">PRODUCT</div><div>${escapeHtml(t.product)}</div></div>
      <div><div class="form-label">REFERENCE</div><div>${escapeHtml(t.reference)}</div></div>
      <div><div class="form-label">QUANTITY</div><div>${t.quantity}</div></div>
      <div><div class="form-label">TOTAL</div><div style="font-size:1.25rem;font-weight:700;">$${(t.total || 0).toFixed(2)}</div></div>
    </div>
  `, `<button type="button" class="btn btn-primary" data-edit-txn="${escapeHtml(t.id)}">Edit</button><button type="button" class="btn btn-outline danger" data-delete-txn="${escapeHtml(t.id)}">Delete</button><button type="button" class="btn btn-outline" data-modal-close>Close</button>`);
  $("#modals").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit-txn], [data-delete-txn]");
    if (!btn) return;
    const id = btn.dataset.editTxn || btn.dataset.deleteTxn;
    if (btn.dataset.editTxn) {
      const txn = state.transactions.find((x) => String(x.id) === String(id));
      if (txn) { openTransactionForm(txn); $("#modals").innerHTML = ""; }
    } else if (btn.dataset.deleteTxn) {
      const txn = state.transactions.find((x) => String(x.id) === String(id));
      if (txn) confirmDelete("transaction", txn);
    }
  }, { once: true });
}

function confirmDelete(type, item) {
  if (!item) return;
  const names = { product: item.sku, supplier: item.code, customer: item.code, category: item.name, transaction: item.id };
  const msg = type === "category" ? "Products will move to Uncategorized." : "This will permanently remove it.";
  showModal("Delete " + type + "?", `<p>Delete <strong>${escapeHtml(names[type])}</strong>? ${msg}</p>`, `
    <button type="button" class="btn btn-primary" data-confirm-delete="${type}" data-id="${item.id}">Delete</button>
    <button type="button" class="btn btn-outline" data-modal-close>Cancel</button>
  `);
  $("#modals").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-confirm-delete]");
    if (!btn) return;
    const t = btn.dataset.confirmDelete;
    const id = btn.dataset.id;
    if (t && id) {
      try {
        if (t === "product") await api("/api/products/" + encodeURIComponent(id), { method: "DELETE" });
        else if (t === "supplier") await api("/api/suppliers/" + id, { method: "DELETE" });
        else if (t === "customer") await api("/api/customers/" + id, { method: "DELETE" });
        else if (t === "category") await api("/api/categories/" + id, { method: "DELETE" });
        else if (t === "transaction") await api("/api/transactions/" + encodeURIComponent(id), { method: "DELETE" });
        await loadAll();
        renderPage();
      } catch (err) {
        alert(err.message || "Delete failed");
      }
      $("#modals").innerHTML = "";
    }
  }, { once: true });
}

async function updateAlertStatus(id, status) {
  try {
    const updated = await api("/api/alerts/" + encodeURIComponent(id), { method: "PUT", body: JSON.stringify({ status }) });
    state.alerts = state.alerts.map((a) => (a.id === id ? updated : a));
    updateStatusBar();
    renderPage();
  } catch (e) {
    alert(e.message || "Update failed");
  }
}

async function deleteAlert(id) {
  if (!confirm("Delete this alert?")) return;
  try {
    await api("/api/alerts/" + encodeURIComponent(id), { method: "DELETE" });
    state.alerts = state.alerts.filter((a) => a.id !== id);
    updateStatusBar();
    renderPage();
  } catch (e) {
    alert(e.message || "Delete failed");
  }
}

async function clearAllAlerts() {
  if (!confirm("Delete all alerts?")) return;
  try {
    for (const a of state.alerts) await api("/api/alerts/" + encodeURIComponent(a.id), { method: "DELETE" });
    state.alerts = [];
    updateStatusBar();
    renderPage();
  } catch (e) {
    alert(e.message || "Clear failed");
  }
}

function openProductForm(product) {
  const categories = state.categories.map((c) => `<option value="${escapeHtml(c.name)}" ${(product && product.category === c.name) ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("");
  const suppliers = state.suppliers.map((s) => `<option value="${escapeHtml(s.code)}" ${(product && product.supplier === s.code) ? "selected" : ""}>${escapeHtml(s.code)} - ${escapeHtml(s.name)}</option>`).join("");
  const isEdit = !!product;
  showModal(isEdit ? "EDIT PRODUCT" : "ADD PRODUCT", `
    <div id="formError"></div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">SKU (optional)</label><input type="text" class="form-input" id="f_sku" placeholder="SKU-010" value="${escapeHtml(product?.sku || "")}"></div>
      <div class="form-group"><label class="form-label">PRODUCT NAME</label><input type="text" class="form-input" id="f_name" placeholder="Industrial Bearing" value="${escapeHtml(product?.name || "")}" required></div>
      <div class="form-group"><label class="form-label">CATEGORY</label><select class="form-select" id="f_category"><option value="">Select</option>${categories}</select></div>
      <div class="form-group"><label class="form-label">SUPPLIER</label><select class="form-select" id="f_supplier"><option value="">Select</option>${suppliers}</select></div>
      <div class="form-group"><label class="form-label">QUANTITY</label><input type="number" class="form-input" id="f_quantity" value="${product?.quantity ?? ""}"></div>
      <div class="form-group"><label class="form-label">REORDER POINT</label><input type="number" class="form-input" id="f_reorderPoint" value="${product?.reorderPoint ?? ""}"></div>
      <div class="form-group"><label class="form-label">UNIT PRICE</label><input type="number" step="0.01" class="form-input" id="f_price" value="${product?.price ?? ""}"></div>
      <div class="form-group"><label class="form-label">LOCATION</label><input type="text" class="form-input" id="f_location" value="${escapeHtml(product?.location || "")}"></div>
      <div class="form-group span-2"><label class="form-label">LAST RESTOCKED</label><input type="date" class="form-input" id="f_lastRestocked" value="${escapeHtml(product?.lastRestocked || "")}"></div>
    </div>
  `, `
    <button type="button" class="btn btn-outline" data-modal-close>Cancel</button>
    <button type="button" class="btn btn-primary" id="saveProductBtn">${isEdit ? "Update" : "Create"}</button>
  `);
  document.getElementById("saveProductBtn").onclick = async () => {
    const payload = { name: document.getElementById("f_name").value.trim(), category: document.getElementById("f_category").value || null, supplier: document.getElementById("f_supplier").value || null, quantity: Number(document.getElementById("f_quantity").value) || 0, reorderPoint: Number(document.getElementById("f_reorderPoint").value) || 0, price: Number(document.getElementById("f_price").value) || 0, location: document.getElementById("f_location").value.trim() || null, lastRestocked: document.getElementById("f_lastRestocked").value || null };
    const sku = document.getElementById("f_sku").value.trim();
    if (sku) payload.sku = sku;
    if (!payload.name) { document.getElementById("formError").innerHTML = '<div class="alert-error">Name is required</div>'; return; }
    try {
      if (isEdit) await api("/api/products/" + encodeURIComponent(product.id), { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/products", { method: "POST", body: JSON.stringify(payload) });
      await loadAll();
      renderPage();
      $("#modals").innerHTML = "";
    } catch (e) {
      document.getElementById("formError").innerHTML = '<div class="alert-error">' + escapeHtml(e.message) + '</div>';
    }
  };
}

function openSupplierForm(supplier) {
  const isEdit = !!supplier;
  showModal(isEdit ? "EDIT SUPPLIER" : "ADD SUPPLIER", `
    <div id="formError"></div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">CODE (optional)</label><input type="text" class="form-input" id="f_code" value="${escapeHtml(supplier?.code || "")}"></div>
      <div class="form-group"><label class="form-label">SUPPLIER NAME</label><input type="text" class="form-input" id="f_name" value="${escapeHtml(supplier?.name || "")}" required></div>
      <div class="form-group"><label class="form-label">CONTACT NAME</label><input type="text" class="form-input" id="f_contactName" value="${escapeHtml(supplier?.contactName || "")}"></div>
      <div class="form-group"><label class="form-label">STATUS</label><select class="form-select" id="f_status"><option value="active" ${(supplier?.status || "") === "active" ? "selected" : ""}>active</option><option value="on-hold" ${supplier?.status === "on-hold" ? "selected" : ""}>on-hold</option><option value="inactive" ${supplier?.status === "inactive" ? "selected" : ""}>inactive</option></select></div>
      <div class="form-group"><label class="form-label">EMAIL</label><input type="email" class="form-input" id="f_email" value="${escapeHtml(supplier?.email || "")}"></div>
      <div class="form-group"><label class="form-label">PHONE</label><input type="text" class="form-input" id="f_phone" value="${escapeHtml(supplier?.phone || "")}"></div>
      <div class="form-group span-2"><label class="form-label">LOCATION</label><input type="text" class="form-input" id="f_location" value="${escapeHtml(supplier?.location || "")}"></div>
      <div class="form-group"><label class="form-label">LEAD TIME (days)</label><input type="number" class="form-input" id="f_leadTimeDays" value="${supplier?.leadTimeDays ?? ""}"></div>
      <div class="form-group"><label class="form-label">ON-TIME RATE (%)</label><input type="number" class="form-input" id="f_onTimeRate" value="${supplier?.onTimeRate ?? ""}"></div>
      <div class="form-group"><label class="form-label">PAYMENT TERMS</label><input type="text" class="form-input" id="f_paymentTerms" value="${escapeHtml(supplier?.paymentTerms || "")}"></div>
      <div class="form-group"><label class="form-label">LAST ORDER DATE</label><input type="date" class="form-input" id="f_lastOrderDate" value="${escapeHtml(supplier?.lastOrderDate || "")}"></div>
      <div class="form-group"><label class="form-label">TOTAL SPEND</label><input type="number" class="form-input" id="f_totalSpend" value="${supplier?.totalSpend ?? ""}"></div>
    </div>
  `, `<button type="button" class="btn btn-outline" data-modal-close>Cancel</button><button type="button" class="btn btn-primary" id="saveSupplierBtn">${isEdit ? "Update" : "Create"}</button>`);
  document.getElementById("saveSupplierBtn").onclick = async () => {
    const payload = { name: document.getElementById("f_name").value.trim(), contactName: document.getElementById("f_contactName").value.trim() || null, email: document.getElementById("f_email").value.trim() || null, phone: document.getElementById("f_phone").value.trim() || null, location: document.getElementById("f_location").value.trim() || null, status: document.getElementById("f_status").value, leadTimeDays: document.getElementById("f_leadTimeDays").value ? Number(document.getElementById("f_leadTimeDays").value) : null, onTimeRate: document.getElementById("f_onTimeRate").value ? Number(document.getElementById("f_onTimeRate").value) : null, paymentTerms: document.getElementById("f_paymentTerms").value.trim() || null, lastOrderDate: document.getElementById("f_lastOrderDate").value || null, totalSpend: document.getElementById("f_totalSpend").value ? Number(document.getElementById("f_totalSpend").value) : 0 };
    if (document.getElementById("f_code").value.trim()) payload.code = document.getElementById("f_code").value.trim();
    if (!payload.name) { document.getElementById("formError").innerHTML = '<div class="alert-error">Name is required</div>'; return; }
    try {
      if (isEdit) await api("/api/suppliers/" + supplier.id, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/suppliers", { method: "POST", body: JSON.stringify(payload) });
      await loadAll();
      renderPage();
      $("#modals").innerHTML = "";
    } catch (e) {
      document.getElementById("formError").innerHTML = '<div class="alert-error">' + escapeHtml(e.message) + '</div>';
    }
  };
}

function openCustomerForm(customer) {
  const isEdit = !!customer;
  showModal(isEdit ? "EDIT CUSTOMER" : "ADD CUSTOMER", `
    <div id="formError"></div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">CODE (optional)</label><input type="text" class="form-input" id="f_code" value="${escapeHtml(customer?.code || "")}"></div>
      <div class="form-group"><label class="form-label">CUSTOMER NAME</label><input type="text" class="form-input" id="f_name" value="${escapeHtml(customer?.name || "")}" required></div>
      <div class="form-group"><label class="form-label">TYPE</label><select class="form-select" id="f_type"><option value="B2B" ${(customer?.type || "B2B") === "B2B" ? "selected" : ""}>B2B</option><option value="B2C" ${customer?.type === "B2C" ? "selected" : ""}>B2C</option></select></div>
      <div class="form-group"><label class="form-label">STATUS</label><select class="form-select" id="f_status"><option value="active" ${(customer?.status || "") === "active" ? "selected" : ""}>active</option><option value="on-hold" ${customer?.status === "on-hold" ? "selected" : ""}>on-hold</option><option value="inactive" ${customer?.status === "inactive" ? "selected" : ""}>inactive</option></select></div>
      <div class="form-group"><label class="form-label">CONTACT NAME</label><input type="text" class="form-input" id="f_contactName" value="${escapeHtml(customer?.contactName || "")}"></div>
      <div class="form-group"><label class="form-label">LOCATION</label><input type="text" class="form-input" id="f_location" value="${escapeHtml(customer?.location || "")}"></div>
      <div class="form-group"><label class="form-label">EMAIL</label><input type="email" class="form-input" id="f_email" value="${escapeHtml(customer?.email || "")}"></div>
      <div class="form-group"><label class="form-label">PHONE</label><input type="text" class="form-input" id="f_phone" value="${escapeHtml(customer?.phone || "")}"></div>
      <div class="form-group"><label class="form-label">TOTAL ORDERS</label><input type="number" class="form-input" id="f_totalOrders" value="${customer?.totalOrders ?? ""}"></div>
      <div class="form-group"><label class="form-label">TOTAL REVENUE</label><input type="number" class="form-input" id="f_totalRevenue" value="${customer?.totalRevenue ?? ""}"></div>
      <div class="form-group"><label class="form-label">CREDIT LIMIT</label><input type="number" class="form-input" id="f_creditLimit" value="${customer?.creditLimit ?? ""}"></div>
      <div class="form-group"><label class="form-label">BALANCE</label><input type="number" class="form-input" id="f_balance" value="${customer?.balance ?? ""}"></div>
      <div class="form-group span-2"><label class="form-label">LAST ORDER DATE</label><input type="date" class="form-input" id="f_lastOrderDate" value="${escapeHtml(customer?.lastOrderDate || "")}"></div>
    </div>
  `, `<button type="button" class="btn btn-outline" data-modal-close>Cancel</button><button type="button" class="btn btn-primary" id="saveCustomerBtn">${isEdit ? "Update" : "Create"}</button>`);
  document.getElementById("saveCustomerBtn").onclick = async () => {
    const payload = { name: document.getElementById("f_name").value.trim(), type: document.getElementById("f_type").value, contactName: document.getElementById("f_contactName").value.trim() || null, email: document.getElementById("f_email").value.trim() || null, phone: document.getElementById("f_phone").value.trim() || null, location: document.getElementById("f_location").value.trim() || null, status: document.getElementById("f_status").value, totalOrders: Number(document.getElementById("f_totalOrders").value) || 0, totalRevenue: Number(document.getElementById("f_totalRevenue").value) || 0, lastOrderDate: document.getElementById("f_lastOrderDate").value || null, creditLimit: Number(document.getElementById("f_creditLimit").value) || 0, balance: Number(document.getElementById("f_balance").value) || 0 };
    if (document.getElementById("f_code").value.trim()) payload.code = document.getElementById("f_code").value.trim();
    if (!payload.name) { document.getElementById("formError").innerHTML = '<div class="alert-error">Name is required</div>'; return; }
    try {
      if (isEdit) await api("/api/customers/" + customer.id, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/customers", { method: "POST", body: JSON.stringify(payload) });
      await loadAll();
      renderPage();
      $("#modals").innerHTML = "";
    } catch (e) {
      document.getElementById("formError").innerHTML = '<div class="alert-error">' + escapeHtml(e.message) + '</div>';
    }
  };
}

function openTransactionForm(txn) {
  const products = state.products.map((p) => `<option value="${escapeHtml(p.sku)}" ${(txn && txn.sku === p.sku) ? "selected" : ""}>${escapeHtml(p.sku)} - ${escapeHtml(p.name)}</option>`).join("");
  const suppliers = state.suppliers.map((s) => `<option value="${escapeHtml(s.code)}" ${(txn && txn.supplierCode === s.code) ? "selected" : ""}>${escapeHtml(s.code)} - ${escapeHtml(s.name)}</option>`).join("");
  const customers = state.customers.map((c) => `<option value="${escapeHtml(c.code)}" ${(txn && txn.customerCode === c.code) ? "selected" : ""}>${escapeHtml(c.code)} - ${escapeHtml(c.name)}</option>`).join("");
  const occurredAt = txn?.date ? txn.date.replace(" ", "T").slice(0, 16) : "";
  const isEdit = !!txn;
  showModal(isEdit ? "EDIT TRANSACTION" : "RECORD TRANSACTION", `
    <div id="formError"></div>
    <div class="form-grid">
      <div class="form-group span-2"><label class="form-label">REFERENCE</label><input type="text" class="form-input" id="f_reference" value="${escapeHtml(txn?.reference || "")}" required></div>
      <div class="form-group"><label class="form-label">TYPE</label><select class="form-select" id="f_type"><option value="in" ${(txn?.type || "in") === "in" ? "selected" : ""}>in</option><option value="out" ${txn?.type === "out" ? "selected" : ""}>out</option><option value="adjust" ${txn?.type === "adjust" ? "selected" : ""}>adjust</option></select></div>
      <div class="form-group"><label class="form-label">OCCURRED AT</label><input type="datetime-local" class="form-input" id="f_occurredAt" value="${escapeHtml(occurredAt)}"></div>
      <div class="form-group span-2"><label class="form-label">PRODUCT (SKU)</label><select class="form-select" id="f_productSku" required><option value="">Select</option>${products}</select></div>
      <div class="form-group"><label class="form-label">SUPPLIER</label><select class="form-select" id="f_supplierCode"><option value="">Select</option>${suppliers}</select></div>
      <div class="form-group"><label class="form-label">CUSTOMER</label><select class="form-select" id="f_customerCode"><option value="">Select</option>${customers}</select></div>
      <div class="form-group"><label class="form-label">QUANTITY</label><input type="number" class="form-input" id="f_quantity" value="${txn?.quantity ?? ""}"></div>
      <div class="form-group"><label class="form-label">UNIT PRICE</label><input type="number" step="0.01" class="form-input" id="f_unitPrice" value="${txn?.unitPrice ?? ""}"></div>
      <div class="form-group span-2"><label class="form-label">NOTES</label><input type="text" class="form-input" id="f_notes" value="${escapeHtml(txn?.notes || "")}"></div>
    </div>
  `, `<button type="button" class="btn btn-outline" data-modal-close>Cancel</button><button type="button" class="btn btn-primary" id="saveTxnBtn">${isEdit ? "Update" : "Create"}</button>`);
  document.getElementById("saveTxnBtn").onclick = async () => {
    const ref = document.getElementById("f_reference").value.trim();
    const productSku = document.getElementById("f_productSku").value;
    if (!ref || !productSku) { document.getElementById("formError").innerHTML = '<div class="alert-error">Reference and Product are required</div>'; return; }
    const payload = { reference: ref, type: document.getElementById("f_type").value, productSku, supplierCode: document.getElementById("f_supplierCode").value || null, customerCode: document.getElementById("f_customerCode").value || null, quantity: Number(document.getElementById("f_quantity").value) || 0, unitPrice: Number(document.getElementById("f_unitPrice").value) || 0, notes: document.getElementById("f_notes").value.trim() || null };
    const dt = document.getElementById("f_occurredAt").value;
    if (dt) payload.occurredAt = new Date(dt).toISOString();
    try {
      if (isEdit) await api("/api/transactions/" + encodeURIComponent(txn.id), { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/transactions", { method: "POST", body: JSON.stringify(payload) });
      await loadAll();
      renderPage();
      $("#modals").innerHTML = "";
    } catch (e) {
      document.getElementById("formError").innerHTML = '<div class="alert-error">' + escapeHtml(e.message) + '</div>';
    }
  };
}

function openCategoryForm(category) {
  const isEdit = !!category;
  showModal(isEdit ? "EDIT CATEGORY" : "NEW CATEGORY", `
    <div id="formError"></div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">CODE (optional)</label><input type="text" class="form-input" id="f_code" value="${escapeHtml(category?.code || "")}"></div>
      <div class="form-group"><label class="form-label">NAME</label><input type="text" class="form-input" id="f_name" value="${escapeHtml(category?.name || "")}" required></div>
      <div class="form-group span-2"><label class="form-label">DESCRIPTION</label><input type="text" class="form-input" id="f_description" value="${escapeHtml(category?.description || "")}"></div>
      <div class="form-group span-2"><label class="form-label">SUBCATEGORIES (comma separated)</label><input type="text" class="form-input" id="f_subcategories" value="${Array.isArray(category?.subcategories) ? category.subcategories.join(",") : (category?.subcategories || "")}"></div>
      <div class="form-group"><label class="form-label">STATUS</label><select class="form-select" id="f_status"><option value="active" ${(category?.status || "active") === "active" ? "selected" : ""}>active</option><option value="inactive" ${category?.status === "inactive" ? "selected" : ""}>inactive</option></select></div>
    </div>
  `, `<button type="button" class="btn btn-outline" data-modal-close>Cancel</button><button type="button" class="btn btn-primary" id="saveCatBtn">${isEdit ? "Update" : "Create"}</button>`);
  document.getElementById("saveCatBtn").onclick = async () => {
    const name = document.getElementById("f_name").value.trim();
    if (!name) { document.getElementById("formError").innerHTML = '<div class="alert-error">Name is required</div>'; return; }
    const payload = { name, description: document.getElementById("f_description").value.trim() || null, subcategories: document.getElementById("f_subcategories").value.trim() || null, status: document.getElementById("f_status").value };
    if (document.getElementById("f_code").value.trim()) payload.code = document.getElementById("f_code").value.trim();
    try {
      if (isEdit) await api("/api/categories/" + category.id, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/categories", { method: "POST", body: JSON.stringify(payload) });
      await loadAll();
      renderPage();
      $("#modals").innerHTML = "";
    } catch (e) {
      document.getElementById("formError").innerHTML = '<div class="alert-error">' + escapeHtml(e.message) + '</div>';
    }
  };
}

function openAlertForm(alert) {
  const products = state.products.map((p) => `<option value="${escapeHtml(p.sku)}" ${(alert && alert.sku === p.sku) ? "selected" : ""}>${escapeHtml(p.sku)} - ${escapeHtml(p.name)}</option>`).join("");
  const isEdit = !!alert;
  const alertAt = alert?.date ? alert.date.replace(" ", "T").slice(0, 16) : "";
  showModal(isEdit ? "EDIT ALERT" : "NEW ALERT", `
    <div id="formError"></div>
    <div class="form-grid">
      <div class="form-group span-2"><label class="form-label">PRODUCT (SKU)</label><select class="form-select" id="f_productSku" required><option value="">Select</option>${products}</select></div>
      <div class="form-group"><label class="form-label">TYPE</label><select class="form-select" id="f_type"><option value="critical" ${alert?.type === "critical" ? "selected" : ""}>critical</option><option value="warning" ${(alert?.type || "warning") === "warning" ? "selected" : ""}>warning</option><option value="info" ${alert?.type === "info" ? "selected" : ""}>info</option></select></div>
      <div class="form-group"><label class="form-label">STATUS</label><select class="form-select" id="f_status"><option value="active" ${(alert?.status || "active") === "active" ? "selected" : ""}>active</option><option value="acknowledged" ${alert?.status === "acknowledged" ? "selected" : ""}>acknowledged</option><option value="resolved" ${alert?.status === "resolved" ? "selected" : ""}>resolved</option></select></div>
      <div class="form-group"><label class="form-label">CURRENT STOCK</label><input type="number" class="form-input" id="f_current" value="${alert?.current ?? ""}"></div>
      <div class="form-group"><label class="form-label">THRESHOLD</label><input type="number" class="form-input" id="f_threshold" value="${alert?.threshold ?? ""}"></div>
      <div class="form-group span-2"><label class="form-label">MESSAGE</label><input type="text" class="form-input" id="f_message" value="${escapeHtml(alert?.message || "")}" required></div>
      <div class="form-group span-2"><label class="form-label">ALERT TIME</label><input type="datetime-local" class="form-input" id="f_alertAt" value="${escapeHtml(alertAt)}"></div>
    </div>
  `, `<button type="button" class="btn btn-outline" data-modal-close>Cancel</button><button type="button" class="btn btn-primary" id="saveAlertBtn">${isEdit ? "Update" : "Create"}</button>`);
  document.getElementById("saveAlertBtn").onclick = async () => {
    const productSku = document.getElementById("f_productSku").value;
    const message = document.getElementById("f_message").value.trim();
    if (!productSku || !message) { document.getElementById("formError").innerHTML = '<div class="alert-error">Product and message are required</div>'; return; }
    const payload = { type: document.getElementById("f_type").value, status: document.getElementById("f_status").value, productSku, current: Number(document.getElementById("f_current").value) || 0, threshold: Number(document.getElementById("f_threshold").value) || 0, message };
    const dt = document.getElementById("f_alertAt").value;
    if (dt) payload.alertAt = new Date(dt).toISOString();
    try {
      if (isEdit) await api("/api/alerts/" + encodeURIComponent(alert.id), { method: "PUT", body: JSON.stringify(payload) });
      else await api("/api/alerts", { method: "POST", body: JSON.stringify(payload) });
      await loadAll();
      renderPage();
      $("#modals").innerHTML = "";
    } catch (e) {
      document.getElementById("formError").innerHTML = '<div class="alert-error">' + escapeHtml(e.message) + '</div>';
    }
  };
}

function init() {
  $$(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeSection = btn.dataset.section;
      $$(".nav-item").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderPage();
    });
  });

  const sidebar = $("#sidebar");
  const toggle = $("#sidebarToggle");
  const overlay = $("#sidebarOverlay");
  if (toggle) toggle.addEventListener("click", () => { sidebar.classList.toggle("collapsed"); });
  if (overlay) overlay.addEventListener("click", () => { sidebar.classList.remove("open"); overlay.classList.remove("visible"); });

  const refreshBtn = $("#refreshBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", async () => { await loadAll(); renderPage(); });

  const loginBtn = $("#loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      openLoginModal();
    });
  }

  // Restore previously logged-in user if present
  try {
    const raw = window.localStorage.getItem("inventoryProUser");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        state.user = parsed;
      }
    }
  } catch (_) {
    // ignore
  }

  loadAll().then(() => renderPage());
}

document.addEventListener("DOMContentLoaded", init);
