// Core UI + API utilities shared across all pages

const API_CONFIG = (function () {
  const raw = window.__API_BASE__ || "/api";
  const base = String(raw).replace(/\/+$/g, "");
  return { BASE_URL: base };
})();

document.addEventListener("DOMContentLoaded", () => {
  const pageId = document.body.dataset.page || "dashboard";
  initSidebar(pageId);
  initProfileMenu();
  initDarkMode();
  initGlobalSearch();
  initModal();
});

function initSidebar(currentPage) {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");

  const toggleSidebar = () => {
    sidebar.classList.toggle("open");
    sidebarBackdrop.classList.toggle("visible");
  };

  if (sidebarToggle) sidebarToggle.addEventListener("click", toggleSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", toggleSidebar);

  const sidebarDarkToggle = document.getElementById("sidebar-dark-toggle");
  if (sidebarDarkToggle) {
    sidebarDarkToggle.addEventListener("click", toggleDarkMode);
  }
}

function initProfileMenu() {
  document.addEventListener("click", (evt) => {
    const trigger = document.getElementById("profile-trigger");
    const menu = document.getElementById("profile-menu");
    if (!trigger || !menu) return;

    if (trigger.contains(evt.target)) {
      menu.classList.toggle("open");
    } else if (!menu.contains(evt.target)) {
      menu.classList.remove("open");
    }
  });
}

function initDarkMode() {
  const saved = localStorage.getItem("inventory-dark-mode");
  if (saved === "true") {
    document.body.classList.add("dark-mode");
  }

  const topbarToggle = document.getElementById("topbar-theme-toggle");
  if (topbarToggle) {
    topbarToggle.addEventListener("click", toggleDarkMode);
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const enabled = document.body.classList.contains("dark-mode");
  localStorage.setItem("inventory-dark-mode", enabled ? "true" : "false");
}

function initGlobalSearch() {
  const input = document.getElementById("global-search-input");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    const event = new CustomEvent("global-search", { detail: { query } });
    window.dispatchEvent(event);
  });
}

function initModal() {
  const backdrop = document.getElementById("global-modal-backdrop");
  const closeBtn = document.getElementById("modal-close-btn");
  const modal = document.getElementById("global-modal");

  if (!backdrop || !closeBtn || !modal) return;

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (evt) => {
    if (evt.target === backdrop) {
      closeModal();
    }
  });
}

function openModal({ title, body, footerButtons }) {
  const backdrop = document.getElementById("global-modal-backdrop");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const footerEl = document.getElementById("modal-footer");

  if (!backdrop || !titleEl || !bodyEl || !footerEl) return;

  titleEl.textContent = title || "";
  bodyEl.innerHTML = "";
  if (typeof body === "string") {
    bodyEl.innerHTML = body;
  } else if (body instanceof HTMLElement) {
    bodyEl.appendChild(body);
  }

  footerEl.innerHTML = "";
  (footerButtons || []).forEach((btn) => {
    const button = document.createElement("button");
    button.type = btn.type || "button";
    button.className = btn.className || "btn btn-primary";
    button.textContent = btn.label;
    if (btn.icon) {
      button.innerHTML = `<i class="${btn.icon}"></i><span>${btn.label}</span>`;
    }
    if (btn.onClick) {
      button.addEventListener("click", btn.onClick);
    }
    footerEl.appendChild(button);
  });

  backdrop.classList.add("open");
}

function closeModal() {
  const backdrop = document.getElementById("global-modal-backdrop");
  if (!backdrop) return;
  backdrop.classList.remove("open");
}

function showSpinner(show) {
  const spinner = document.getElementById("global-spinner");
  if (!spinner) return;
  spinner.classList.toggle("visible", !!show);
}

function showAlert(type, message) {
  const container = document.getElementById("alert-container");
  if (!container) return;

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;

  const iconClass =
    type === "success" ? "fa-check-circle" : type === "error" ? "fa-times-circle" : "fa-info-circle";

  alert.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <div>${message}</div>
    <button class="alert-close" aria-label="Dismiss">
      <i class="fas fa-times"></i>
    </button>
  `;

  const close = () => {
    alert.classList.add("hidden");
    alert.addEventListener("transitionend", () => alert.remove(), { once: true });
    setTimeout(() => alert.remove(), 200);
  };

  alert.querySelector(".alert-close").addEventListener("click", close);
  container.appendChild(alert);

  setTimeout(close, 4500);
}

function setPageTitle(text) {
  const el = document.getElementById("page-title");
  const topbarTitle = document.getElementById("topbar-title-text");
  if (el) el.textContent = text || "";
  if (topbarTitle) topbarTitle.textContent = text || "";
}

function setPageSubtitle(text) {
  const el = document.getElementById("page-subtitle");
  if (el) el.textContent = text || "";
}

function setPageActions(actions = []) {
  const container = document.getElementById("page-actions");
  if (!container) return;
  container.innerHTML = "";

  actions.forEach((cfg) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = cfg.className || "btn btn-primary";
    if (cfg.icon) {
      btn.innerHTML = `<i class="${cfg.icon}"></i><span>${cfg.label}</span>`;
    } else {
      btn.textContent = cfg.label;
    }
    if (cfg.onClick) {
      btn.addEventListener("click", cfg.onClick);
    }
    container.appendChild(btn);
  });
}

function setLowStockBadge(count) {
  const badge = document.getElementById("nav-low-stock-badge");
  if (!badge) return;
  badge.textContent = `${count} low`;
}

// Fetch helpers

async function apiRequest(path, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    showSpinner(true);
    const response = await fetch(url, { ...options, headers });

    const contentType = response.headers.get("Content-Type") || "";
    let payload = null;
    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (payload && payload.message) || `Request failed (${response.status})`;
      throw new Error(errorMessage);
    }

    return payload;
  } catch (err) {
    const raw = String(err && err.message ? err.message : "").toLowerCase();
    const friendly = raw.includes("failed to fetch")
      ? "Network request failed. Ensure the backend is running and CORS is allowed."
      : err.message || "Request failed";

    showAlert("error", friendly);
    throw err;
  } finally {
    showSpinner(false);
  }
}

function apiGet(path) {
  return apiRequest(path, { method: "GET" });
}

function apiPost(path, body) {
  return apiRequest(path, { method: "POST", body: JSON.stringify(body) });
}

function apiPut(path, body) {
  return apiRequest(path, { method: "PUT", body: JSON.stringify(body) });
}

function apiDelete(path) {
  return apiRequest(path, { method: "DELETE" });
}

// Simple confirmation dialog before delete / destructive actions
function confirmAction({ title, message, onConfirm }) {
  const body = document.createElement("div");
  body.innerHTML = `
    <p class="modal-note">${message}</p>
    <p class="text-muted">
      This action cannot be easily undone. Make sure you have verified this record.
    </p>
  `;

  openModal({
    title: title || "Confirm action",
    body,
    footerButtons: [
      {
        label: "Cancel",
        className: "btn btn-outline",
        onClick: () => closeModal(),
      },
      {
        label: "Yes, continue",
        className: "btn btn-danger",
        onClick: () => {
          closeModal();
          if (typeof onConfirm === "function") {
            onConfirm();
          }
        },
      },
    ],
  });
}

// Generic pagination + filtering helpers

function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return {
    pageItems: items.slice(start, end),
    total,
    totalPages,
    currentPage,
  };
}

function createPaginationControls({
  container,
  pageState,
  onPageChange,
}) {
  if (!container) return;
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "pagination";

  const info = document.createElement("span");
  info.textContent = `Page ${pageState.currentPage} of ${pageState.totalPages} • ${pageState.total} records`;

  const controls = document.createElement("div");
  controls.className = "pagination-controls";

  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = pageState.currentPage === 1;
  prev.addEventListener("click", () => onPageChange(pageState.currentPage - 1));

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = pageState.currentPage === pageState.totalPages;
  next.addEventListener("click", () => onPageChange(pageState.currentPage + 1));

  controls.appendChild(prev);
  controls.appendChild(next);

  wrapper.appendChild(info);
  wrapper.appendChild(controls);
  container.appendChild(wrapper);
}

