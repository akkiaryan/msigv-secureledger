# 📌 MSIGV SecureLedger

### Maa Santoshi Indane Gramin Vitrak (LPG Operations & Ledger Management System)
**Designed and Developed by [Akki Aryan](https://github.com/akkiaryan)**

---

## 📖 Introduction & System Overview
**MSIGV SecureLedger** is a secure, state-of-the-art, and responsive internal operations management portal built specifically for **Maa Santoshi Indane Gramin Vitrak (MSIGV)**, an authorized LPG Gas distributor of **IndianOil**. 

This system replaces manual register books and error-prone sheets with a role-restricted, audit-logged, and double-entry style inventory ledger. It tracks cylinder movements (14.2kg Domestic, 19kg Commercial), commercial client credit balances, daily stock closings, security mismatch alerts, SBC/DBC installations, and employee logs with cryptographic integrity.

---

## 🛠️ Technology Stack
* **Framework**: Next.js 16 (App Router, Turbopack)
* **Language**: Vanilla Javascript (ES6+)
* **Database**: PostgreSQL (Hosted on Neon Database Serverless Pooler)
* **ORM**: Prisma Client v5
* **Authentication**: NextAuth.js (Session JWT, Credentials Provider, BCrypt encryption)
* **Styling**: TailwindCSS (v4) with custom PostCSS rendering
* **Visualizations**: Recharts (Dynamic Daily/EOD inventory trendlines)
* **Icons**: Lucide React

---

## 👥 Identity & Access Management (IAM) Roles

The portal implements strict role-based access control (RBAC). A user's role dictates what features, actions, and data scopes they are permitted to interact with:

```
┌──────────────────────────────────────────────────────────────┐
│                        NextAuth Gate                         │
└──────────────────────────────┬───────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
     [ ADMIN ]            [ EMPLOYEE ]          [ AUDITOR ]
  Full Read/Write       Restricted Loggers       Financials
  Approval Queue        Only Own Log View       Attachments
  Audit Logs            Saves as PENDING        Read-Only
```

### 1. Admin / Manager
* **Access Scope**: Full system clearance.
* **Key Privileges**:
  * Manage active inventory pools (Fills, Empties, Damaged, Valve Defects, Leakages).
  * Approve or Reject submissions from the global **Verification Queue** (Deliveries, SBC/DBC Connections, Incident Reports, Empty Returns).
  * Generate tax invoices, adjust stocks with required audit remarks, adjust credit balances.
  * Access comprehensive system audit logs tracking user activity.

### 2. Employee (Field/Counter Staff)
* **Access Scope**: Locked to submission logging and personal logs.
* **Key Privileges**:
  * Log domestic/commercial deliveries, empty returns, SBC/DBC installations, incidents, eKYC, and card book transactions.
  * View **only** their own logged history.
  * Print or download immediate PDF slips and receipts for entries they personally logged.
  * *Restriction*: All entries are marked as `PENDING` and do not adjust stock levels until approved by an Admin.

### 3. Auditor
* **Access Scope**: Read-only financial statements.
* **Key Privileges**:
  * Read commercial outstanding credit ledger, cash-in-hand logs, expense records, and EOD statements.
  * Review daily closings and system mismatches.
  * Upload verification attachments and add auditor comments to locked daily closings.
  * *Restriction*: Cannot create transactions, modify stock, or approve logs.

---

## 🔄 Logical Operations Workflow

The system models the lifecycle of LPG cylinders within the distributorship. The flowchart below visualizes this lifecycle:

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    actor Employee
    actor Customer
    participant Inventory
    participant PendingQueue
    participant CommercialLedger

    %% Cylinder Intake
    Admin->>Inventory: Record Bulk Cylinder Intake (Load)
    Note over Inventory: Increments Filled Stock<br/>Decrements Empties Returned to Bottling Plant

    %% Delivery Logging
    Employee->>Customer: Deliver LPG Cylinders
    Employee->>PendingQueue: Log Delivery Transaction (PENDING)
    Note over Employee: Requires 6-Digit DAC code for Domestic
    
    %% Approval Flow
    Admin->>PendingQueue: Review & Approve Transaction
    PendingQueue->>Inventory: Adjust Stock (Filled -Qty, Empty +Returned)
    
    %% Commercial Credit Ledger
    alt is Commercial Credit Customer
        PendingQueue->>CommercialLedger: Create Outstanding Balance Record
        Customer->>Employee: Pay Outstanding Amount (Log Payment)
        Admin->>CommercialLedger: Clear Outstanding Credit
    end
    
    %% EOD Balance Matching
    Admin->>Inventory: Record Physical Count (Daily EOD Closing)
    Note over Inventory: System computes: Mismatch = Physical - Expected
    alt Mismatch Detected
        Inventory->>Admin: Trigger Critical Security Alert
    end
```

### 1. Cylinder Intake (Bulk Load Arrival)
1. Trucks from the IndianOil Bottling Plant arrive with filled cylinders and collect empty ones.
2. The Admin logs a **Bulk Load** with the vehicle number, receipt count of filled cylinders, and empties returned.
3. This directly adjusts the inventory ledger balances.

### 2. LPG Sales & Deliveries
1. **Domestic Refills**: Logged by Employees. To prevent leakage of cylinders outside the system, a **6-Digit Delivery Authentication Code (DAC)** is strictly validated.
2. **Commercial Deliveries**: Logged by Employees. If the customer does not exist, employees or admins can register the commercial customer in-line directly from the form.
3. Upon logging, the transaction sits in the **Verification Queue** as `PENDING`. No stock is updated.

### 3. Verification & Approval
1. The Admin checks the **Verification Queue**.
2. Clicking **Approve** commits the transaction:
   * Increments/decrements filled and empty cylinder inventory counters.
   * Creates outstanding credit trackers in the **Commercial Ledger** if the payment mode is `CREDIT`.

### 4. Empty Returns & Credit Settlement
1. Empties returned after the sale are logged. When verified, they increment the distributor's empty stock count.
2. Outstanding payments are logged via the **Payments Form**, reducing the commercial customer's outstanding financial balance.

### 5. EOD Daily Closing & Mismatch Alerting
1. At the end of the day, supervisors physically count the stock inside the godown.
2. They enter these counts into the **Daily Closing Form** (14.2kg Filled, 14.2kg Empty, 19kg Filled, 19kg Empty, Damaged, Leakages).
3. The system compares the physical count with the expected database inventory:
   $$\text{Mismatch} = \text{Physical Count} - \text{Expected Count}$$
4. If a mismatch exists, it generates a **Security Alert** on the Admin dashboard and logs it in the audit trail. The closing is locked to prevent retrospective alterations.

---

## 🗄️ Database Schema Details

The application utilizes a PostgreSQL relational database. Key models defined in `prisma/schema.prisma` include:

* **`User`**: System credentials, role profiles, and connection statuses.
* **`Employee`**: Registry profiles mapping workers to delivery tasks, daily wage rates, and active states.
* **`Customer`**: Commercial businesses or domestic families, storing addresses, consumer numbers, categories, and opening outstanding financial balances.
* **`Inventory`**: Stores the absolute physical counters for filled, empty, damaged, and leakage cylinders.
* **`Delivery` & `DeliveryItem`**: Track quantity, DAC verification code, billing rates, and approval state.
* **`CommercialLedger`**: Tracking customer-specific invoice payments, balance pending, empty cylinder pending, and credit due dates.
* **`DailyClosing`**: EOD record of physical vs. expected cylinder counts, cash-in-hand, and lock status.
* **`CylinderIncident`**: Records regulator returns, safety leakages, physical damages, and photo attachments.
* **`AuditLog`**: Unalterable record capturing the state differential (`oldState` vs `newState`) for administrative actions.

---

## 🎨 Visual System & Spacing Rules
The UI is built according to IndianOil design conventions:
* **Brand Theme**: Safety Orange (`#F37022`) for call-to-actions, active links, and primary buttons. Deep Navy (`#02164F`) for branding text and navigation headers.
* **Structure Layout**: 
  * Max container width: `1280px`
  * Content Desktop Padding: `32px`
  * Grid Card Spacing: `16px` to `20px`
  * Card Border Radius: `16px` (`rounded-2xl`)
  * Card Border Accent: `#E8EAF0`
  * Form shells restricted to `max-w-2xl` to prevent input stretching and input clutter.

---

## 🚀 Installation & Running Locally

### 📋 Prerequisites
* Node.js (v18.x or v20.x recommended)
* A running PostgreSQL database (or Neon serverless cluster)

### 1. Clone the repository and install dependencies
```bash
git clone https://github.com/akkiaryan/msigv-secureledger.git
cd msigv-secureledger
npm install
```

### 2. Set up Environment Variables
Create a file named `.env.local` in the root directory:
```env
DATABASE_URL="postgresql://username:password@hostname:5432/dbname?sslmode=require"
NEXTAUTH_SECRET="your-generated-jwt-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database Schema and Seed Accounts
Apply the database schemas and seed the initial users (Admin, Employee, Auditor):
```bash
npx prisma db push
node scripts/seed-prisma.js
```

### 4. Run the Dev Server
Launch Next.js development mode with Turbopack:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## ⚖️ License & Copyright
**Copyright © 2026 Akki Aryan & Maa Santoshi Indane Gramin Vitrak. All Rights Reserved.**

This project is proprietary and closed-source. All rights, designs, and intellectual assets belong to **Akki Aryan** (the system creator) and **Maa Santoshi Indane Gramin Vitrak** (the distribution agency). Any unauthorized copying, distribution, modification, or reuse of this repository is strictly prohibited under the terms of the accompanying [LICENSE](file:///Volumes/MONARC/Project%20IOCL%20internal%20System/LICENSE).
