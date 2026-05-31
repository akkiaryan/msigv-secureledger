# MSIGV SecureLedger

Maa Santoshi Indane Gramin Vitrak SecureLedger is an enterprise-grade operational ledger and inventory management platform custom-built for LPG (Liquefied Petroleum Gas) distributorship workflows. 

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/akkiaryan/msigv-secureledger)
[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6-blue)](https://nextjs.org/)
[![Prisma Version](https://img.shields.io/badge/Prisma-5.22.0-indigo)](https://prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

---

## Overview

In traditional LPG distributorships, operational transactions (refill bookings, empty cylinder returns, security deposit records, regulator leakages, and daily closing balances) are managed using manual paper registers and fragmented spreadsheets. This approach introduces transactional errors, reconciliation delays, untracked inventory leakages, and security risks.

MSIGV SecureLedger solves these challenges by providing a secure, digital operational control layer directly aligned with standard IndianOil (Indane) distributorship workflows. The platform digitizes paper registers, enforces double-entry verification on stock movements, tracks commercial credit balances, and maintains immutable audit trails of all critical updates. It enforces a strict operational workflow where the distributor's inventory must be initialized with opening balances before daily operations can be recorded.

---

## Features

### Inventory
* **Opening Stock Initialization**: Restricts general operations until opening stock balances are verified and locked.
* **Filled Cylinder Tracking**: Real-time decrementing of filled stocks for 14.2kg Domestic and 19kg Commercial cylinders.
* **Empty Cylinder Tracking**: Automatic incrementing of empty cylinders returned by delivery staff or customers.
* **Accessory Tracking**: System registers regulator stocks and Suraksha hose pipe transactions.

### Operations
* **Refill Entry**: Single-page form to capture delivery details, DAC (Delivery Authentication Code) validations, rates, and cash/UPI collection.
* **Connection Registration**: Records new Single Bottle Connections (SBC) and Double Bottle Connections (DBC), capturing consumer deposits, eKYC fees, and LPG card book charges.
* **Incident Reporting**: Logs regulator defect serial numbers, leaking cylinders, valve issues, and structural damages with optional media uploads.

### Audit
* **Daily Closing**: Supervisors enter EOD physical stock checks and physical cash in hand.
* **Mismatch Detection**: The system calculates expected balances based on the day's transaction logs and flags surpluses or deficits in real time.
* **Verification Workflow**: Restricts database modifications once the auditor closes and locks a operational cycle.

### Reporting
* **CSV Export**: Compiles dynamic filter logs (Refills, Ledger, Connections, Incidents, Closings) into standard formats.
* **PDF Reports**: Generates formal operations reports styled with distributor logos, SAP Codes, validation timestamps, and signature blocks.
* **Monthly Archive**: Synthesizes month-end operational totals, generates historical logs, and wipes operational caches.

### Security
* **Role-Based Access Control (RBAC)**: Strict permission boundaries for Admins, Employees, and Auditors.
* **Protected Routes**: Middleware and inline guards intercept unauthorized route access and console state modifications.
* **Session Management**: Secure JSON Web Tokens (JWT) manage session lifetimes and back-button cache replays.
* **Audit Logs**: Every inventory mutation, connection update, and supervisor reset is permanently recorded in a central log table.

---

## Architecture

The diagram below details the data flow and system architecture:

```mermaid
graph TD
    subgraph Users ["Access Roles"]
        A[Admin / Manager]
        B[Employee / Delivery Staff]
        C[Auditor]
    end

    subgraph AppShell ["Next.js Application Layer"]
        D[Middleware / Access Controller]
        E[Dashboard Controller]
        F[Server Actions / Validation Rules]
    end

    subgraph DataAccess ["Prisma ORM Layer"]
        G[Prisma Client API]
    end

    subgraph Persistence ["Storage Layer"]
        H[(PostgreSQL / Neon DB)]
    end

    subgraph Output ["Downstream Processing"]
        I[Audit Logs]
        J[PDF / CSV Generators]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    H --> J
```

---

## System Roles

Permissions are strictly enforced at both the client-side UI and server action validation layers:

| Feature / Action | Admin | Employee | Auditor |
| :--- | :---: | :---: | :---: |
| Initialize Opening Stock | Yes | No | Yes |
| Enter Refill Delivery | Yes | Yes | No |
| Create SBC / DBC Connection | Yes | Yes | No |
| File Incident Report | Yes | Yes | No |
| Perform Daily Closing Input | Yes | No | Yes |
| Verify Discrepancies & Lock | Yes | No | Yes |
| Manage Staff Invites | Yes | No | No |
| Access Settings & Unit Prices | Yes | No | No |
| Compile Monthly Archives | Yes | No | No |
| Generate CSV / PDF Reports | Yes | No | Yes |
| View System Audit Logs | Yes | No | Yes |

---

## Technology Stack

* **Frontend**: Next.js (App Router), React, Tailwind CSS
* **Backend**: Next.js Server Actions, Zod (Data Validation)
* **Database**: PostgreSQL (Managed on Neon), Prisma ORM
* **Authentication**: Auth.js (NextAuth.js v4)
* **Deployment**: Vercel
* **Developer Tooling**: TypeScript, ESLint, Prisma Studio

---

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema models and relations
├── public/
│   └── logo.png               # Distributor branding assets
├── scripts/
│   ├── reset-clean.js         # Production environment clean reset script
│   └── seed-prisma.js         # User role and base stock configuration seeds
├── src/
│   ├── app/
│   │   ├── actions.js         # Unified server actions and transaction logic
│   │   ├── globals.css        # Base styling variables and element styling
│   │   ├── layout.js          # App metadata and root layout wrapper
│   │   ├── page.js            # Main dashboard route controller
│   │   ├── sign-in/
│   │   │   └── page.js        # Secure login route
│   │   └── components/
│   │       ├── DashboardClient.js # Root client dashboard container
│   │       └── GenericFormShell.js# Flat form UI elements
├── capacitor.config.json      # Mobile shell mapping file (if applicable)
└── package.json               # Package dependencies and operational scripts
```

### Directory Details
* `prisma/`: Holds PostgreSQL schema structures.
* `public/`: Static resources served directly by Next.js.
* `scripts/`: Local seed routines and database cleaning scripts.
* `src/app/`: Core route components and styles.
* `src/app/components/`: Modular frontend UI blocks.

---

## Database Design

The database schema utilizes PostgreSQL tables linked via Prisma:

```
[User] -- 1:N --> [DailyClosing] <-- 1:N --> [AuditorVerification]
  |
 1:N
  v
[AuditLog]

[Customer] -- 1:N --> [Delivery] <-- 1:N --> [DeliveryItem]
  |                     |
 1:N                   1:N
  v                     v
[CustomerConnection]  [CommercialLedger]
```

### Core Entities

#### Users (`users`)
Stores administrator, employee, and auditor system credentials.
* **Fields**: `id` (String, PK), `username` (String, Unique), `passwordHash` (String), `name` (String), `role` (Enum), `isActive` (Boolean).

#### InventoryBalance (`inventory`)
Maintains real-time stock balances.
* **Fields**: `id` (String, PK), `cylinderType` (Enum, Unique), `filledStock` (Int), `emptyStock` (Int), `damagedStock` (Int), `leakageStock` (Int).

#### InventoryTransaction (`inventory_transactions`)
Tracks all historic stock additions, sales, and corrections.
* **Fields**: `id` (String, PK), `transactionDate` (DateTime), `eventType` (String), `referenceId` (String), `cylinderType` (Enum), `filledChange` (Int), `emptyChange` (Int), `damagedChange` (Int), `leakageChange` (Int).

#### RefillEntry (`deliveries` & `delivery_items`)
Saves customer deliveries and cylinder transactions.
* **Fields (Delivery)**: `id` (String, PK), `deliveryDate` (DateTime), `customerId` (String, FK), `customerName` (String), `paymentStatus` (String), `totalAmount` (Float), `amountReceived` (Float), `amountPending` (Float).
* **Fields (DeliveryItem)**: `id` (String, PK), `deliveryId` (String, FK), `cylinderType` (Enum), `quantityDelivered` (Int), `emptyReturned` (Int), `dacCode` (String), `dacVerified` (Boolean), `ratePerCylinder` (Float), `lineTotal` (Float).

#### ConnectionEntry (`customer_connections`)
Registers consumer setup fees and connection types.
* **Fields**: `id` (String, PK), `customerName` (String), `consumerNumber` (String), `connectionType` (Enum), `cylinderSecurityDeposit` (Float), `totalAmount` (Float), `amountPaid` (Float), `amountPending` (Float), `eKycDone` (Boolean), `lpgCardBookRequired` (Boolean).

#### IncidentEntry (`cylinder_incidents`)
Logs defect assets and returns.
* **Fields**: `id` (String, PK), `incidentDate` (DateTime), `cylinderType` (Enum), `quantity` (Int), `incidentCategory` (String), `issueType` (String), `regulatorSerialNumber` (String), `reportedBy` (String), `photoUrl` (String).

#### DailyClosing (`daily_closing`)
Logs EOD checks and balances.
* **Fields**: `id` (String, PK), `closingDate` (DateTime, Unique), `supervisorId` (String, FK), `physical14Filled` (Int), `physical14Empty` (Int), `physical19Filled` (Int), `physical19Empty` (Int), `cashInHand` (Float), `isLocked` (Boolean).

#### Archive (`monthly_archives`)
Caches historic monthly business metrics.
* **Fields**: `id` (String, PK), `month` (Int), `year` (Int), `openingStock` (String), `closingStock` (String), `totalDeliveries` (Int), `totalCashReceived` (Float), `totalExpenses` (Float), `commercialPending` (Float).

#### AuditLog (`audit_logs`)
Maintains system audit trails.
* **Fields**: `id` (String, PK), `userId` (String, FK), `role` (String), `action` (String), `tableName` (String), `recordId` (String), `oldState` (Json), `newState` (Json), `remarks` (String).

---

## Inventory Lifecycle

The flow below details how stock moves through the system during a typical operational cycle:

```mermaid
graph TD
    A[1. Opening Stock Initialization] -->|Admin sets baseline stock| B(2. Running Stock Inventory)
    B -->|Employee enters delivery booking| C[3. Refill Entry Stock Movement]
    C -->|Filled - Qty / Empty + Qty| B
    B -->|Supervisor submits physical count| D[4. Daily Closing EOD Submission]
    D -->|Calculates system vs physical delta| E{5. Audit Verification Check}
    E -->|Mismatches identified / locked| F[6. Monthly Archives Compilation]
    F -->|Operational cache cleared / locked| G[7. Historical Storage Block]
```

---

## Installation

### Prerequisites
* Node.js v20.x or higher
* PostgreSQL instance (local or managed)

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/akkiaryan/msigv-secureledger.git
   cd msigv-secureledger
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Compile database assets:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Seed database credentials:
   ```bash
   npx prisma db seed
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

---

## Environment Variables

Ensure the following variables are configured in `.env.local` for development and Vercel Settings for production:

```ini
# Primary database connection string for Prisma operations
DATABASE_URL="postgresql://neondb_owner:npg_z8ZBSDLmQYw2@ep-bold-king-apdsh4xa-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Direct connection string for migrations (bypasses pooling layers)
DIRECT_URL="postgresql://neondb_owner:npg_z8ZBSDLmQYw2@ep-bold-king-apdsh4xa-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Random 32-character string for NextAuth session encryption
AUTH_SECRET="msigv-operations-secure-ledger-secret-717"

# Base URL mapping for authentication routing
NEXTAUTH_URL="http://localhost:3000"

# Application deployment mode environment flag
NODE_ENV="development"
```

---

## Development Workflow

We follow a strict development branch workflow:

```
feature-branch --> code validation --> pull request --> review/approve --> main (autodeploy)
```

### Branching Standard
1. Check out a branch from `main`:
   ```bash
   git checkout -b feature/issue-reference
   ```
2. Commit localized changes:
   ```bash
   git commit -m "feat(api): add validation guards for commercial delivery"
   ```
3. Push to remote origin:
   ```bash
   git push origin feature/issue-reference
   ```
4. Open a Pull Request (PR) against `main`. Once approved, merge to trigger the Vercel deployment pipeline.

---

## Quality Assurance

### Validation Suite
* **Functional Testing**: Verifies refill deliveries, connection deposit tracking, and incident logging interfaces.
* **Role Testing**: Validates route intercepts and API guard blocks for unauthorized sessions.
* **Inventory Testing**: Asserts that transaction rollbacks occur if filled stock levels drop below zero.
* **Audit Testing**: Validates expected versus physical balance calculation formulas.
* **Archive Testing**: Checks the integrity of aggregate data backups before operational tables are cleared.
* **Security Testing**: Ensures parameter checks render SQL injections and cross-site scripting vectors ineffective.

### Production Release Checklist
Before merging features to `main`, engineers must run:
```bash
# 1. Clear database structure and seed default setup
npm run db:reset-clean

# 2. Re-compile Prisma bindings
npx prisma generate

# 3. Test compilation output
npm run build
```

---

## Deployment

### Vercel Deployment Configurations
1. **Repository Link**: Link the GitHub repository to the Vercel project.
2. **Environment Mapping**: Populate the environment variables (`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NODE_ENV`) in the Project Settings.
3. **Build Script**: Ensure the build command is configured as:
   ```bash
   prisma generate && next build
   ```
4. **Post-Deployment Verification**: Verify that log triggers, route guards, and static favicon images render correctly on the public Vercel URL.

---

## Security Considerations

* **Role-Based Access Control**: Enforced via secure session profiles mapped to database entries.
* **Route Protection**: Pages are wrapped in server checks; API actions reject queries if session credentials mismatch.
* **Session Validation**: Uses secure client cookies with custom JWT expiration rules.
* **Input Validation**: Server actions validate incoming payloads against strict Zod parsing schemas.
* **Audit Trail**: Operational mutations are logged with the acting user's profile and timestamp details.

---

## Roadmap

* **SMS Integration**: Automated dispatch of DAC confirmation alerts and pending ledger notifications to consumers.
* **Oracle Sync Layer**: Direct API synchronization with corporate IndianOil backend mainframes.
* **Offline Mode**: Local storage cache layer to enable operational updates during godown network outages.
* **Multi-Distributor Support**: Multi-tenant database mapping to host multiple distributor setups.
* **Mobile Application**: Dedicated application wrapper for delivery staff.
* **Advanced Analytics**: Interactive dashboards for tracking cylinder turnover ratios and commercial credit trends.

---

## Contributing

1. Fork the project repository.
2. Maintain clean code compliance matching project ESLint and prettier structures.
3. Keep pull requests focused; do not combine structural and visual styling modifications.
4. Ensure all database model modifications include companion migrations.

---

## License

This software is distributed under the MIT License. See [LICENSE](file:///Volumes/MONARC/Project%20IOCL%20internal%20System/LICENSE) for details.

---

## Maintainers

* **Repository Owner**: [akkiaryan](https://github.com/akkiaryan)
* **Contributors**: Maa Santoshi Systems Engineering Team
