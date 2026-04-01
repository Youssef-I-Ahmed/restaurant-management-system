# 🍽️ Smart Restaurant Management System

A scalable full-stack system designed to digitize and optimize restaurant operations with real-world business logic.

---

## 🚀 Overview

The **Smart Restaurant Management System** is a full-stack application that transforms traditional restaurant workflows into a secure, role-driven, and automated digital platform.

It focuses on real-world business scenarios such as:

- Order lifecycle management
- Inventory tracking with audit logs
- Role-based access control (RBAC)
- Data-driven decision support via Dashboard

> 📌 Built as a **portfolio-ready system** demonstrating backend architecture, business logic, and scalability.

---

## 🧠 Key Concepts Implemented

- 🔐 Authentication & Authorization (JWT + RBAC)
- 🏗️ Clean Architecture (Routes / Controllers / Middleware)
- 🔄 Real Business Workflow (Order lifecycle)
- 📦 Inventory with audit logging
- 📊 Aggregation-ready Dashboard
- 🧩 Modular & scalable backend design

---

## 🛠️ Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/Bcrypt-12100E?style=for-the-badge&logo=security&logoColor=white)
![Joi](https://img.shields.io/badge/Joi-0080FF?style=for-the-badge&logo=joi&logoColor=white)
![dotenv](https://img.shields.io/badge/Dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black)

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | API framework |
| MongoDB + Mongoose | Database & ODM |
| JWT | Authentication |
| bcrypt | Password hashing |
| Joi | Validation middleware |

### Frontend *(In Progress)*
- React.js
- Axios API Integration
- Role-based UI Rendering
- Dashboard with Charts

---

## 🏗️ System Architecture

```
Client (React)
      ↓
API Layer (Express Routes)
      ↓
Controllers (Business Logic)
      ↓
Models (MongoDB - Mongoose)
      ↓
Database
```

- ✔️ Modular structure implemented in `app.js` with separated routes
- ✔️ Each feature isolated: `auth` / `product` / `order` / `inventory`

---

## 👥 Roles & Permissions

| Role | Capabilities |
|---|---|
| **Admin** | Full system control |
| **Manager** | Manage menu & inventory + monitor orders |
| **Cashier** | Create & manage orders |
| **Kitchen** | Update order status only |

> 🔒 Access enforced via middleware: `authMiddleware` + `roleAuthorize`

---

## ⚙️ Core Features

### 🔐 Authentication System
- Register users *(Admin only)*
- Login with JWT
- Protected routes
- Change password
- Soft delete users

✔️ Validation using Joi schemas

---

### 🍽️ Menu Management

**Categories**
- Nested categories (parent / child)
- Prevent deletion if has subcategories or products

**Products**
- Full CRUD operations
- Auto profit calculation:
  ```
  profit = price - cost
  ```
- Prevent deletion if linked to active orders

✔️ Profit automatically calculated in model middleware

---

### 🧾 Orders System *(Core Logic)*

**Order Workflow:**
```
Pending → Preparing → Ready → Completed
                ↘ Cancelled
```

**Business Rules:**
- ❌ Cannot edit after `Preparing`
- ❌ Only Cashier / Admin can cancel *(before Preparing)*
- 👨‍🍳 Kitchen can only update status
- 💰 Total auto-calculated

✔️ Status transitions enforced in controller logic

---

### 📦 Inventory System
- Real-time stock tracking
- Auto deduction when order is created
- Prevent order if stock is insufficient
- Low stock alerts
- Full audit log via `InventoryLog`

✔️ Every movement is tracked: *deduction / restock / return*  
✔️ Inventory linked one-to-one with each product

---

### 📊 Dashboard *(Backend Ready)*
- Daily revenue
- Orders count
- Top-selling products
- Order status distribution

---

## 🗄️ Database Design

**Main Collections:**
- `Users`
- `Categories` *(Tree structure)*
- `Products`
- `Orders`
- `Inventory`
- `InventoryLog`

**Relations:**
- Category → Products `(1:M)`
- Product → Inventory `(1:1)`
- Order → Items `(1:M)`
- InventoryLog → Full audit trail

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
POST   /api/auth/change-password
```

### Categories
```
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

### Products
```
GET    /api/products
POST   /api/products
PUT    /api/products/:id
PATCH  /api/products/:id/status
DELETE /api/products/:id
```

### Orders
```
GET    /api/orders
POST   /api/orders
PUT    /api/orders/:id
PATCH  /api/orders/:id/status
DELETE /api/orders/:id
```

### Inventory
```
GET    /api/inventory
PUT    /api/inventory/:productId
POST   /api/inventory/restock
GET    /api/inventory/low-stock
GET    /api/inventory/logs
```

---

## 🔥 Business Logic Highlights

| Rule | Description |
|---|---|
| ❌ Category deletion | Cannot delete if it has subcategories or products |
| ❌ Product deletion | Cannot delete if linked to existing orders |
| ❌ Unavailable product | Cannot be added to orders |
| ❌ Stock limit | Cannot order beyond available quantity |
| 🔄 Auto inventory | Updated automatically with every order |
| 📜 Audit trail | Every inventory movement is fully logged |

---

## 🧪 Validation & Error Handling

- Joi validation layer on all inputs
- Standard HTTP status codes: `400` / `401` / `403` / `404` / `500`
- Consistent API response format across all endpoints

---

## 📈 Development Roadmap

| Phase | Description | Status |
|---|---|---|
| 1.1 | Authentication | ✅ Done |
| 1.2 | Categories & Products | ✅ Done |
| 1.3 | Orders System | ✅ Done |
| 1.4 | Inventory | ✅ Done |
| 1.5 | Dashboard | ✅ Done |
| **2** | **Analytics** | 🚧 Planned |
| **3** | **AI Prediction** | 🔮 Future |

---

## 📊 Phase 2 — Analytics *(Planned)*

The Analytics phase will transform raw operational data into actionable business insights.

**Planned Features:**
- 📅 **Time-based Revenue Reports** — Daily, weekly, and monthly breakdowns with trend visualization
- 🏆 **Top Performers** — Best-selling products, busiest hours, and peak days analysis
- 👥 **Staff Performance Metrics** — Orders handled per cashier, average processing time
- 📉 **Inventory Analytics** — Consumption rate per product, waste tracking, restocking patterns
- 🧾 **Order Analytics** — Cancellation rate, average order value, order frequency heatmaps
- 📤 **Exportable Reports** — PDF / CSV export for business reporting

> 🎯 Goal: Give managers and admins a 360° view of restaurant performance without needing external BI tools.

---

## 🤖 Phase 3 — AI Prediction *(Future)*

The AI Prediction phase will bring machine learning into the core of restaurant operations.

**Planned Features:**
- 🔮 **Demand Forecasting** — Predict which products will sell most based on historical data, day of week, and season
- 📦 **Smart Restocking Suggestions** — Auto-recommend restock quantities before stock runs out
- ⚠️ **Anomaly Detection** — Flag unusual spikes or drops in orders or inventory that might indicate errors or fraud
- 💸 **Dynamic Pricing Insights** — Suggest optimal pricing based on demand trends and profit margins
- 🗓️ **Staffing Recommendations** — Predict busy periods and recommend shift scheduling accordingly
- 🧠 **AI-Powered Dashboard** — Natural language summaries of daily/weekly business performance

> 🎯 Goal: Move from reactive management to **proactive, data-driven decision making** — reducing waste, increasing profit, and improving customer satisfaction.

---

## 🎯 Project Goal

This project demonstrates:

- ✅ Real-world backend system design
- ✅ Business logic implementation
- ✅ Scalable and modular architecture
- ✅ Production-ready coding practices

> 💼 Designed to strengthen a **Junior Full Stack Developer** portfolio

---

## 👨‍💻 Author

**Yousef Ismail Ahmed**

🎓 BIS Graduate  
🤖 AI-Based Software Development Trainee  
🔗 [LinkedIn](https://linkedin.com)

---

## ⭐ Support

If you found this project useful:

👉 Give it a **Star** on GitHub  
👉 **Share** it with others in your network

---

## 📁 Documentation

Full Idea Report available in `/docs`
