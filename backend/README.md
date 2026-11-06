# POS System — Backend API

Express + MongoDB (Mongoose) multi-branch point-of-sale backend.

## Features
- Role-based auth (JWT): `super_admin`, `branch_manager`, `cashier`
- Branch-scoped data access — cashiers/managers are locked to their assigned branch
- Product, customer, inventory, purchase-order, and inter-branch transfer management
- Transactional stock movement (Mongoose sessions) with a full inventory audit log
- Cash-register shift open/close with cash reconciliation
- Sales history, returns/refunds, dashboard reporting, and barcode/SKU quick lookup

---

## Setup

```bash
# 1. install
npm install

# 2. configure environment
cp .env.example .env
#    edit .env: set MONGO_URI and a strong JWT_SECRET

# 3. seed test data (branches, users, products, inventory, shifts, audit logs)
node seeders/seed.js

# 4. run
npm run dev          # nodemon, dev
# or
node server.js
```

### Environment variables (`.env`)
| Variable | Required | Description |
|---|---|---|
| `PORT` | no | HTTP port (default `4000`) |
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used to sign auth tokens |
| `NODE_ENV` | no | `development` enables verbose auth debug logs; `production` silences them |
| `CORS_ORIGIN` | no | Optional CORS origin |

### Seeded accounts
| Email | Password | Role | Branch |
|---|---|---|---|
| `admin@pos.com` | `password123` | `super_admin` | — |
| `manager1@pos.com` | `password123` | `branch_manager` | Main Branch |
| `cashier1@pos.com` | `password123` | `cashier` | Main Branch |

---

## API endpoint reference

All responses use the shape `{ "status": "success"|"failed", "msg"?, "data"? }`.
"auth" = requires a `Bearer` token. Roles are enforced via the `isAllowed` middleware.

### Auth
| Method & path | Roles | Notes |
|---|---|---|
| `POST /api/auth/login` | public | Returns a JWT |
| `POST /api/auth/register` | `super_admin` | Registration is admin-only |
| `GET /api/auth/Hello` | `super_admin`, `branch_manager` | Smoke test |

### Branches
| Method & path | Roles |
|---|---|
| `GET /api/branches` | auth |
| `GET /api/branches/:id` | auth |
| `POST /api/branches` | `super_admin` |
| `PUT /api/branches/:id` | `super_admin` |
| `DELETE /api/branches/:id` | `super_admin` |

### Users
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/users` | `super_admin`, `branch_manager` | `super_admin` sees everyone (optional `branchId` filter); `branch_manager` is scoped to their own branch |
| `GET /api/users/:id` | auth | Scoped roles may only view their own profile |
| `PUT /api/users/:id` | `super_admin` | Can reassign `branchId`, set `isActive`/`password` |
| `DELETE /api/users/:id` | `super_admin` | Self-delete is blocked |

### Products
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/products` | auth | Filter: `category`, `search`, `minPrice`, `maxPrice`; paginated |
| `GET /api/products/lookup?barcode=&sku=&branchId=` | auth | POS fast-path: product + live stock for a branch |
| `GET /api/products/category/:category` | auth | |
| `GET /api/products/:id` | auth | |
| `POST /api/products` | `super_admin`, `branch_manager` | |
| `PUT /api/products/:id` | `super_admin`, `branch_manager` | |
| `DELETE /api/products/:id` | `super_admin`, `branch_manager` | |

### Customers
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/customers` | auth | Filter: `branchId`, `search` |
| `GET /api/customers/:id` | auth | |
| `POST /api/customers` | `super_admin`, `branch_manager` | Branch is resolved server-side (scoped roles → their branch) |
| `PUT /api/customers/:id` | `super_admin`, `branch_manager` | |
| `DELETE /api/customers/:id` | `super_admin`, `branch_manager` | |

### Inventory
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/inventory/:branchId` | auth | Stock levels, populated products |
| `GET /api/inventory/low-stock` | auth | `quantity <= reorderLevel`; optional `?branchId=` |
| `GET /api/inventory/:productId/history` | auth | Audit trail; filter `branchId`, `from`, `to`; paginated |
| `POST /api/inventory/adjust` | `super_admin`, `branch_manager` | Manual stock change, transactional, writes an audit log |

### Purchase orders
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/purchase-orders` | `super_admin`, `branch_manager` | Filter `status`, `branchId`; paginated |
| `GET /api/purchase-orders/:id` | auth | |
| `POST /api/purchase-orders` | `super_admin`, `branch_manager` | `totalCost` computed server-side |
| `PUT /api/purchase-orders/:id` | `super_admin`, `branch_manager` | Blocked once `received` |
| `DELETE /api/purchase-orders/:id` | `super_admin`, `branch_manager` | Blocked once `received` |
| `PUT /api/purchase-orders/:id/receive` | `super_admin`, `branch_manager` | Transactional: increments stock + writes audit logs |

### Transfers
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/transfers` | `super_admin`, `branch_manager` | Filter `status`, `sourceBranchId`, `destinationBranchId`; paginated |
| `GET /api/transfers/:id` | auth | |
| `POST /api/transfers` | `super_admin`, `branch_manager` | Request a transfer (source is branch-scoped) |
| `PUT /api/transfers/:id` | `super_admin`, `branch_manager` | Status transitions only: `pending→in_transit/rejected`, `in_transit→received/rejected` |
| `PUT /api/transfers/:id/receive` | `super_admin`, `branch_manager` | Only from `in_transit`. Transactional: decrements source, increments destination, writes audit logs |

### Sales
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/sales` | auth | Filter `branchId`, `from`, `to`, `status`; paginated. Scoped roles always see their own branch; `super_admin` may filter by branch or omit it for ALL branches |
| `GET /api/sales/:id` | auth | |
| `GET /api/sales/summary` | `super_admin`, `branch_manager` | Aggregated totals + payment mix; same scope rules as `GET /api/sales` |
| `POST /api/sales` | auth | Create a sale (branch resolved server-side; auto-links to open shift) |
| `POST /api/sales/:id/return` | auth | Process a return/refund (transactional; restocks items). The refund is booked to the refunding cashier's open shift in that branch, falling back to the original sale's shift |

### Reports
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/reports/dashboard` | `super_admin`, `branch_manager` | Revenue, top products, revenue-by-branch, payment mix, low-stock alert; filter `branchId`, `from`, `to`. Scoped roles always see their own branch; `super_admin` may omit `branchId` for the org-wide view |

### Shifts
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/shifts` | auth, any role | List shifts; filter `branchId`, `status`; paginated. `super_admin` may omit `branchId` to list all branches |
| `POST /api/shifts/open` | auth | Open a register shift (`openingBalance`). `super_admin` must also pass `branchId`; scoped roles get their branch server-side |
| `GET /api/shifts/active` | auth | Currently open shift(s); `super_admin` may filter by branch or omit for all |
| `GET /api/shifts/:id/summary` | auth | Sales/refund totals + expected drawer balance. Branch permission enforced (scoped roles: own branch only) |
| `POST /api/shifts/:id/close` | auth | Close with `closingBalance`; computes `discrepancy`. Only the opening cashier (or manager of the same branch) may close |

### Settings
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/settings/general` | auth | General app settings (tax rate %, currency, currency symbol, low-stock threshold, allow-negative-stock) |
| `PUT /api/settings/general` | `super_admin` | Partially update the general settings document. `taxRate` must be 0–100 |

---

## Example requests

```bash
# login
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"manager1@pos.com","password":"password123"}'
# => { "status":"success", "token":"...", "data":{"user":{...}} }

TOKEN="<token from above>"

# dashboard
curl "http://localhost:4000/api/reports/dashboard" -H "Authorization: Bearer $TOKEN"

# create a sale (branch auto-resolved for scoped roles)
curl -X POST http://localhost:4000/api/sales \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<productId>","quantity":2}],"paymentMethod":"cash"}'

# open + close a shift
curl -X POST http://localhost:4000/api/shifts/open \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"openingBalance":300}'
curl -X POST http://localhost:4000/api/shifts/<shiftId>/close \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"closingBalance":512}'

# receive a purchase order (transactional stock-in)
curl -X PUT http://localhost:4000/api/purchase-orders/<poId>/receive \
  -H "Authorization: Bearer $TOKEN"

# barcode quick lookup
curl "http://localhost:4000/api/products/lookup?barcode=1234567890123&branchId=<branchId>" \
  -H "Authorization: Bearer $TOKEN"
```

## Testing guide

A quick manual pass (run against a fresh seed):
1. `node seeders/seed.js` then `node server.js`.
2. Log in as each role and confirm 403s where the role is not allowed.
3. As `cashier1`: sell at their own branch (201), try another branch (403).
4. As a manager: create a PO → receive it → check `/api/inventory/<branch>` and
   `/api/inventory/<productId>/history` show the audit entries.
5. Request a transfer → set `in_transit` → receive → verify source decremented,
   destination incremented, and both audit logs exist.
6. Create a sale → return part of it → verify the sale is `returned`, stock is
   restocked, and a `Refund` record exists.
7. Open a shift, run a cash sale, close the shift → verify `discrepancy` is 0.

---

## Architecture notes
- **Branch scoping**: `utils/assertBranchAccess.js` centralizes the rule that
  `cashier`/`branch_manager` may only act on their assigned branch while
  `super_admin` is unrestricted. Every stock- or branch-sensitive write path
  resolves the branch server-side through this helper.
- **Consistent read scoping**: `utils/resolveBranchScope.js` applies the same
  rules to every listing/report endpoint (`sales`, `sales summary`, `shifts`,
  `active shifts`, `dashboard`, `users`). `cashier`/`branch_manager` are always
  filtered to their own branch. `super_admin` sees a specific branch when a
  `branchId` query param is passed, or ALL branches when it is omitted
  (`null` = no branch filter).
- **Transactions**: any operation that mutates `Inventory` alongside another
  model (sale, PO receive, transfer receive, manual adjust, return) runs inside a
  single Mongoose session and commits atomically.
- **Audit trail**: every inventory mutation writes an `InventoryLog` row
  (type, signed change, reference, user, reason) inside the same transaction.

---

## ⚠️ MongoDB replica set requirement (Mongoose transactions)

The sale, return, inventory-adjust, transfer-receive, and purchase-order-receive
flows use **Mongoose sessions/transactions** (`session.startTransaction()`).
MongoDB **transactions only work against a replica set or sharded cluster** —
they are NOT supported on a plain standalone `mongod`. If you run against a
standalone instance you will get failures such as:
`"Transaction numbers are only allowed on a replica set member or mongos"`.

### Running a single-node replica set locally (development)

1. Start MongoDB with `--replSet`:

   ```bash
   # Linux (adjust paths to your install)
   mongod --dbpath /data/db --replSet rs0 --port 27017
   # or with Docker
   docker run -d -p 27017:27017 --name pos-mongo mongo:7 \
     mongod --replSet rs0 --bind_ip_all
   ```

2. Initialize the replica set (once):

   ```bash
   mongosh --port 27017 --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})'
   # inside Docker instead: docker exec -it pos-mongo mongosh --eval ...
   ```

3. Use a connection string that stays on `localhost` (so the set member
   address matches, avoiding `WrongSet`/DNS issues):

   ```
   # .env
   MONGO_URI="mongodb://localhost:27017/pos_system?replicaSet=rs0&directConnection=true"
   ```

### Tests

Pure-logic regression tests run with the Node built-in runner — no database
required:

```bash
npm test        # node --test  (runs backend/tests/*.test.js)
```

They cover branch-scoping rules and the sale money validation. Integration
tests that exercise transactional flows require the single-node replica set
above (they are intentionally kept manual via the Testing guide).
