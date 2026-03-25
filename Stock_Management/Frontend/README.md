# Inventory Pro - Vanilla HTML/CSS/JS Frontend

A plain HTML, CSS, and JavaScript frontend that mirrors the Next.js Inventory Pro UI. Connects to the same backend API for dynamic data.

## Setup

1. **Start the backend** (from project root):
   ```bash
   cd Backend
   npm start
   ```
   The API runs at `http://localhost:4000`.

2. **Serve the frontend** (to avoid CORS when opening files directly):
   ```bash
   cd Frontend
   npx serve .
   ```
   Or use any static server (e.g. `python -m http.server 3000`).

3. Open `http://localhost:3000` (or your server URL) in a browser.

## Features

- **Dashboard** – Stock summary, recent activity, category breakdown, key metrics
- **Products** – List, search, add, edit, delete
- **Suppliers** – List, search, add, edit, delete
- **Customers** – List, search, add, edit, delete
- **Transactions** – List, search, record, edit, delete
- **Categories** – Grid view, add, edit, delete
- **Alerts** – Active/acknowledged lists, add, acknowledge, resolve, delete

All data is loaded from and saved to the backend at `http://localhost:4000`.
