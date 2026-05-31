# MSIGV SecureLedger - Developer Onboarding & Operations Guide

This guide is designed for developers onboarding to the **MSIGV SecureLedger** codebase. It outlines the data layer interaction patterns, UI architecture, local setup routines, operational safeguards, and database reset details.

---

## 1. System Onboarding & File Directory Map

* **`src/app/actions.js`**: Contains all Prisma backend transactions and database mutation logic. Developers adding new operations must create their helper functions here.
* **`src/app/components/DashboardClient.js`**: The root client-side React layout controller. It maintains tab state, form inputs, dynamic totals rendering, and CSV/PDF exporters.
* **`src/app/components/GenericFormShell.js`**: Form wrapper components that enforce boxy borders, standard buttons, and flat visual typography.
* **`prisma/schema.prisma`**: The single source of truth for the database layout. If tables are changed, developers must run `npx prisma generate` to rebuild client types.
* **`scripts/reset-clean.js`**: Clean setup script to reset the system for a production launch or fresh development cycles.

---

## 2. Client/Server Interaction Model

The application leverages Next.js Server Actions for client-to-server operations. Direct database fetches are avoided on client forms:

```
[DashboardClient UI Form] 
       │ (Collect inputs & triggers validation)
       ▼
[actions.js (Server Action)]
       │ (Session checks -> Zod schema parse -> DB transaction)
       ▼
[PostgreSQL Database]
       │ (Success payload / Error rollback)
       ▼
[DashboardClient UI]
       │ (Triggers loadData() to refresh state globally)
       ▼
[Re-render views]
```

### Key Client Integration Guidelines
1. **Zod Validation**: Inputs on the client are mapped to schema keys on the server. Always match input names with the server schema (e.g. `dacCode`, `quantityDelivered`).
2. **Revalidation**: After database mutations succeed, the action invokes `revalidatePath('/')`. The client receives `{ success: true }`, then invokes its local `loadData()` handler to refresh the dashboard indicators.
3. **Form Disable**: Every form submit button must bind to the `isSubmitting` state to block double-click mutations.

---

## 3. Inventory Transaction Rules & Safety Checks

Stock calculations are strictly controlled. Direct update operations on the `Inventory` table are forbidden unless wrapped in a database transaction alongside `InventoryTransaction` records.

### Refill Delivery Transaction Block
When an employee records a refill sale:
1. The server checks the respective cylinder's current `filledStock` in the `Inventory` table.
2. If `filledStock < quantityDelivered`, the transaction throws:
   `throw new Error("Insufficient stock available...")`
   This error aborts the Prisma client transaction, rolling back any partial table writes.
3. If stock is available:
   * Decrements `filledStock` by `quantityDelivered`
   * Increments `emptyStock` by `emptyReturned`
   * Logs `InventoryTransaction` containing the change history
   * Logs `Delivery` and `DeliveryItem` detail records

---

## 4. Daily Closing Verification Pipeline

The Auditor closing flow relies on calculated expected counts versus physical inputs:

### Mismatch Formulas
$$\text{Mismatch Filled} = \text{Physical Count Filled} - \text{Expected Count Filled}$$
$$\text{Mismatch Empty} = \text{Physical Count Empty} - \text{Expected Count Empty}$$

* If $\text{Mismatch} < 0$: A deficit is logged (displays in red text).
* If $\text{Mismatch} > 0$: A surplus is logged (displays in blue text).
* If $\text{Mismatch} = 0$: Reconciled (displays in green/default text).

### Verification Storage
Upon auditor submit:
1. The physical count metrics are saved to `DailyClosing`.
2. Godown visual confirmations (Base64 file reader) are saved to `AuditorVerification`.
3. An `AuditLog` entry is appended to record the EOD lock event.

---

## 5. Database Reset Protocol (`npm run db:reset-clean`)

To clear operational databases before staging, testing, or launch, utilize the clean-up command.

```bash
npm run db:reset-clean
```

### Safety Gateways
* **Production Guard**: The script intercepts executions on `NODE_ENV="production"`.
* **Manual Override**: To run on production databases, developers must explicitly pass the confirmation flag:
  `RESET_CONFIRM="MSIGV_RESET_CLEAN" node scripts/reset-clean.js`
* **Clean State Check**: The script resets filled and empty stock configurations to `0`. On portal reload, the user will see *"Opening stock not initialized"*.

---

## 6. Developer Debugging & QA Checklist

### Node Dependency Warnings
If `npm install` throws resolving errors, run with the legacy flag:
```bash
npm install --legacy-peer-deps
```
This is required because the `next-auth` dependency has an older peer requirement for `nodemailer` than the `mailtrap` script requires.

### Favicon Browser Caching Issues
If browser tabs display generic icons, clear the local assets directory:
1. Next.js generates static metadata templates natively from `src/app/icon.png`.
2. Do not write manual icon link declarations inside `layout.js` metadata blocks.
3. If favicons fail to refresh, perform a hard refresh (`Cmd + Shift + R` or `Ctrl + Shift + R`) and restart the dev server.

### Route Intercept Tampering
Client-side component controls utilize double-layered access checks:
```javascript
// Check inside render loops
{activeTab === 'settings' && isAdmin && (
  <SettingsComponent />
)}
```
Always verify role validations are checked alongside the `activeTab` value to block DOM memory inspections.
