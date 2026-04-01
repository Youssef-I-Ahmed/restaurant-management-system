# Smart Restaurant Management System - Backend

Node.js + Express + MongoDB backend for restaurant operations, with JWT authentication, role-based access control, product/category management, order workflow, and inventory tracking.

## Tech Stack

- Node.js (CommonJS)
- Express 5
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Password hashing (`bcrypt`)
- Request validation (`joi`)

## Implemented Modules

- Authentication and profile management
- User management (admin-only except `GET /users/:id` after auth)
- Category CRUD with parent/child tree support
- Product CRUD with soft delete and availability toggle
- Order lifecycle and role-based transitions
- Inventory quantities, low stock checks, and inventory movement logs

## Roles and Access Summary

- `admin`: full access across all modules
- `manager`: categories, products, inventory, order monitoring, and order cancellation
- `cashier`: create/update own pending orders, complete ready orders, view today's orders
- `kitchen`: view active orders (`pending`, `preparing`, `ready`) and update kitchen transitions

## Important Business Rules

- Registration endpoint is protected and allowed for admins only.
- Product deletion is soft delete (`is_deleted=true`, `is_available=false`).
- Product cannot be deleted if linked to existing orders.
- Inventory is checked before order creation/update; insufficient stock blocks the request.
- Pending orders only can be edited or canceled.
- Order status transitions are role-restricted:
  - Kitchen: `pending -> preparing -> ready`
  - Cashier: `ready -> completed`
  - Admin: `pending -> preparing -> ready -> completed`

## Inventory Logging Design (Updated)

Inventory movement logs are now embedded inside each inventory document:

- Model: `Inventory.logs[]` subdocuments
- Log types: `deduction`, `restock`, `adjustment`, `return`
- Logged fields: quantity change, before/after quantities, reason, related order, performer

This replaced the old standalone `InventoryLog` collection/model.

## API Route Map

Base prefix is `/api`.

### Auth

- `POST /auth/login`
- `POST /auth/register` (admin only)
- `GET /auth/me`
- `PUT /auth/profile`
- `POST /auth/change-password`

### Users

- `GET /users/:id` (authenticated)
- `GET /users` (admin)
- `PUT /users/:id` (admin)
- `PUT /users/:id/role` (admin)
- `DELETE /users/:id` (admin, deactivates account)

### Categories

- `GET /categories`
- `GET /categories/:id`
- `POST /categories` (admin/manager)
- `PUT /categories/:id` (admin/manager)
- `DELETE /categories/:id` (admin/manager)

### Products

- `GET /products`
- `GET /products/:id`
- `POST /products` (admin/manager)
- `PUT /products/:id` (admin/manager)
- `DELETE /products/:id` (admin/manager)
- `PATCH /products/:id/status` (admin/manager)

### Orders

- `GET /orders` (admin/manager/cashier/kitchen)
- `GET /orders/:id` (admin/manager/cashier/kitchen)
- `POST /orders` (cashier/admin)
- `PUT /orders/:id` (cashier/admin)
- `PATCH /orders/:id/status` (kitchen/cashier/admin)
- `DELETE /orders/:id` (cashier/admin/manager)

### Inventory

- `GET /inventory` (admin/manager)
- `GET /inventory/:productId` (admin/manager)
- `PUT /inventory/:productId` (admin/manager)
- `POST /inventory/restock` (admin/manager)
- `GET /inventory/low-stock` (admin/manager)
- `GET /inventory/logs` (admin/manager)

## Query and Filter Highlights

- `GET /products` supports category, min/max price, availability, and include deleted.
- `GET /orders` supports scope/date/cashier/status/total filters with role-aware behavior.
- `GET /inventory/logs` supports `product`, `type`, `dateFrom`, and `dateTo` filters.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file in `Backend/` with at least:

```env
PORT=5000
DB_URL=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d
```

3. Run the server:

```bash
node app.js
```

Server starts at `http://localhost:5000` by default.

## Utility Script

Backfill inventory records for existing products:

```bash
npm run backfill:inventory
```

## Notes

- There is currently no automated test suite configured (`npm test` is placeholder).
- Frontend apps exist in the repository under `Frontend/` and are not covered in this backend README.
