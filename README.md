# 🍽 Smart Restaurant Management System

Full Stack Project

------------------------------------------------------------------------

## 📌 Overview

Smart Restaurant Management System is a scalable digital platform
designed to streamline restaurant operations.\
The system replaces manual processes with a secure, role-driven digital
workflow.

### Core Objectives:

-   Implement secure JWT-based authentication
-   Enforce Role-Based Access Control (RBAC)
-   Build a real-world order lifecycle workflow
-   Manage inventory with automatic stock deduction
-   Provide business insights through a dashboard

------------------------------------------------------------------------

## 🏗 System Architecture

### Backend Stack

-   Node.js
-   Express.js
-   MongoDB (Mongoose)
-   JWT Authentication
-   bcrypt for password hashing
-   Modular Clean Architecture (Routes / Controllers / Services)

### Frontend (Planned)

-   React.js
-   Role-Based UI Rendering
-   Dashboard with charts
-   Full API integration

------------------------------------------------------------------------

## 🔐 Roles & Permissions

  Role            Capabilities
  --------------- -----------------------------------------
  Admin           Full system control
  Manager         Manage menu & inventory, monitor orders
  Cashier         Create & close orders
  Kitchen Staff   Update order status only

------------------------------------------------------------------------

## ⚙ Core Features

### 1️⃣ Authentication & Authorization

-   User registration & login
-   JWT-based session management
-   Role-based route protection
-   Soft-delete for users

### 2️⃣ Menu Management

-   Categories CRUD
-   Products CRUD
-   Profit margin auto-calculation
-   Prevent deletion of products linked to orders

### 3️⃣ Orders Workflow

-   Pending → Preparing → Ready → Completed
-   Inventory auto-deduction on confirmation
-   Orders locked after preparation starts
-   Cancel allowed only before preparation

### 4️⃣ Inventory System

-   Real-time stock tracking
-   Low-stock alerts
-   Inventory movement logging
-   Block order if stock insufficient

### 5️⃣ Dashboard

-   Daily revenue
-   Order count
-   Top-selling products
-   Order status distribution

------------------------------------------------------------------------

## 📊 Development Phases

  Phase       Focus Area
  ----------- ----------------------------
  Phase 1.1   Authentication & Users
  Phase 1.2   Menu & Categories
  Phase 1.3   Orders System
  Phase 1.4   Inventory
  Phase 1.5   Dashboard
  Phase 2     Advanced Analytics
  Phase 3     AI-Based Demand Prediction

------------------------------------------------------------------------

## 🎯 Project Goal

This project demonstrates real-world backend architecture, business
logic implementation, and scalable system design suitable for a junior
Full Stack developer portfolio.

------------------------------------------------------------------------

## 📄 Documentation

Full Project Idea Proposal is available inside the `/docs` folder.

------------------------------------------------------------------------

## Author

Yousef Ismail Ahmed

#### 🔗 LinkedIn:
Yousef Ismail

Data Science & AI-Based Software Development Trainee

👉 (https://www.linkedin.com/in/yousef-ismail87/)


------------------------------------------------------------------------

### ⭐ If you found this project helpful, consider giving it a star!
