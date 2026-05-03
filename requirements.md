# Shiva Vexarts: Project Requirements & Specification

## 1. Project Overview
**Shiva Vexarts** is a full-stack digital storefront and portfolio application built for an artist (Shivakumar S). It provides a platform for visitors to browse digital artworks, interact with an AI assistant, and purchase art prints or digital downloads. The system includes an E-commerce flow and a secure Admin Dashboard ("Command Center") for inventory and order management.

---

## 2. User Roles & Access Levels

### A. Customers / Visitors
**Access Level:** Public to browse, Authentication required to checkout.
- **Browse Gallery:** View the artist's portfolio and collections without logging in.
- **AI Assistance:** Interact with an AI bot for instant answers about pricing, shipping, and commissions.
- **Shopping Cart:** Manage selections, sizes, and quantities.
- **Authenticated Checkout:** Customers must log in to proceed to payment and provide shipping details.
- **Contact:** Submit messages or commission requests.

### B. Administrator (The Artist)
**Access Level:** Protected (Requires Admin Authentication).
- **Admin Terminal:** Full dashboard for business operations.
- **Inventory Management:** Add/edit artwork, manage collections, and upload high-res assets.
- **Order Management:** Track orders, view customer details, and update fulfillment status.
- **Inquiry Management:** Access and respond to contact form submissions.

---

## 3. Core Features

### 🖼️ Frontend & UI
- **Dynamic Storefront:** Hero sections, categorized gallery, and about section.
- **Interactive Cart:** Real-time subtotal calculation and slide-out cart management.
- **AI Chatbot:** Automated support for pricing, shipping, and general artist info.

### 🛒 E-Commerce Flow
- **Multi-Step Checkout:** Shipping info collection -> Order Review -> Payment.
- **Payment Integration:** Secure payment processing via **Khalti**.
- **Order Tracking:** Automated Order IDs and status notifications.

### 🛡️ Admin Dashboard
- **Global Search:** Unified search across artworks, orders, and contacts.
- **Inventory Control:** Drag-and-drop uploads, base price setting, and collection tagging.
- **Status Updates:** Dropdown controls for order fulfillment tracking.

---

## 4. Business Logic (Pricing & Shipping)

### Pricing & Sizing
Final price = `Base Price` * `Size Multiplier`:
- **A4 Print:** 1.0x
- **A3 Print:** 1.5x
- **A2 Print:** 2.5x
- **Digital Download:** 0.6x

### Shipping Rates
- **Kathmandu Valley:** Rs. 150
- **Outside Kathmandu Valley:** Rs. 250
- **India:** Rs. 500
- **International:** Rs. 1,500

---

## 5. Technical Stack

### Core Technologies
- **Frontend Framework:** React 19 + Vite 7
- **Styling:** Tailwind CSS 3.4 + shadcn/ui
- **Backend Framework:** Hono + Node.js 20
- **API Layer:** tRPC v11 (End-to-end typesafety)
- **Database:** Neon Serverless Postgres
- **ORM:** Drizzle ORM
- **Storage:** Vercel Blob (Artwork and asset hosting)

### State & Logic
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Form Handling:** React Hook Form + Zod validation
- **Authentication:** JWT (jose) + Bcryptjs

---

## 6. Data Entities

### Users
- Fields: ID, Email, Password, Name, Role (admin/user), CreatedAt.

### Artworks
- Fields: ID, Slug, Title, Category, Collection, Description, ImageURL, BasePrice, Dimensions, Featured.

### Orders
- Fields: ID, OrderNumber, CustomerInfo, Address, TotalAmount, Status, PaymentRef, Timestamps.

### Order Items
- Fields: ID, OrderID, ArtworkID, Size, Quantity, CalculatedPrice.

### Contacts
- Fields: ID, Name, Email, Subject, Message, SubmittedAt.
