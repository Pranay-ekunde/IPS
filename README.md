# 📦 Item & Purchase Management System (IPS)

A full-stack web application for tracking inventory, item types, stock availability, and purchase orders with real-time stock deduction and order management.
<img width="1915" height="981" alt="Screenshot 2026-09-19 133630" src="https://github.com/user-attachments/assets/151b0e2d-d866-4657-afd3-87d6181d83e7" />

---

## ✨ Features

- **📂 Item Type Management**: Create, edit, list, and delete item categories with dependency checks.
- **📦 Items & Stock Control**: Track items, stock quantities, active/inactive statuses, and purchase dates.
- **🛒 Purchase Orders**:
  - Process orders with multiple line items.
  - Automatic inventory stock deduction upon purchase creation.
  - Stock restoration and recalculation when updating existing orders.
  - Prevention of duplicate items within a single purchase.
- **📊 Interactive Dashboard & Stock Overview**:
  - Real-time inventory metrics (Total Items, Active Items, Low Stock, Total Orders).
  - Filter items by stock availability (*In Stock*, *Low Stock (1–5)*, *Out of Stock*).
- **⚡ Automatic Database Schema Setup**: Automatically creates required MySQL database tables and seeds initial sample data on server startup if missing.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MySQL2 (`mysql2/promise`), `dotenv`, `cors`, `body-parser`
- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+ Fetch API)
- **Database**: MySQL 8.0+

---

## 📁 Directory Structure

```text
IPS/
├── backend/
│   ├── controllers/
│   │   ├── itemController.js        # Item CRUD & status toggle logic
│   │   ├── itemTypeController.js    # Item category management
│   │   └── purchaseController.js    # Purchase order & stock update logic
│   ├── db/
│   │   ├── connection.js            # MySQL connection pool (with dateStrings support)
│   │   └── initDb.js                # Auto database schema & seed initializer
│   ├── routes/
│   │   ├── items.js                 # /api/items endpoints
│   │   ├── itemTypes.js             # /api/item-types endpoints
│   │   └── purchases.js             # /api/purchases endpoints
│   ├── .env                         # Database environment configuration
│   ├── .env.example                 # Example environment file
│   ├── package.json
│   └── server.js                    # Express application entry point
├── frontend/
│   ├── css/
│   │   └── style.css                # Application styles and responsive design
│   ├── js/
│   │   └── api.js                   # Client-side API fetch client & date formatting helpers
│   ├── pages/
│   │   ├── item-types.html          # Item types management page
│   │   ├── items.html               # Items management page
│   │   ├── purchases.html           # Purchase orders page
│   │   └── stock.html               # Stock overview page
│   └── index.html                   # Main Dashboard page
├── .gitignore
├── schema.sql                       # Database creation SQL script & seed data
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/installer/) running locally or remotely

### 1. Clone the Repository

```bash
git clone https://github.com/Pranay-ekunde/IPS.git
cd IPS
```

### 2. Configure Environment Variables

Create or edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD="YourMySQLPassword"
DB_NAME=item_purchase_db
PORT=3000
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Start the Application

```bash
npm start
```

*Or for development with automatic reload:*

```bash
npm run dev
```

The database schema and sample data will automatically initialize if the database is empty.

### 5. Access the Web Application

Open your browser and navigate to:

```text
http://localhost:3000
```

---

## 📡 API Reference

### Item Types (`/api/item-types`)
- `GET /api/item-types` — Fetch all item types
- `POST /api/item-types` — Create a new item type
- `PUT /api/item-types/:id` — Update item type name
- `DELETE /api/item-types/:id` — Delete item type (if not linked to items)

### Items (`/api/items`)
- `GET /api/items` — Fetch all items with type names
- `GET /api/items/:id` — Fetch single item details
- `POST /api/items` — Create a new item
- `PUT /api/items/:id` — Update existing item details
- `PATCH /api/items/:id/toggle` — Toggle active/inactive status
- `DELETE /api/items/:id` — Delete item (if no purchase history exists)

### Purchases (`/api/purchases`)
- `GET /api/purchases` — List all purchase orders
- `GET /api/purchases/:id` — Fetch purchase details and line items
- `POST /api/purchases` — Create a purchase order and deduct item stock
- `PUT /api/purchases/:id` — Update a purchase order and recalculate stock

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
