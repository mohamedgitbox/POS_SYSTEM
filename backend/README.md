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
| `GET /api/users` | `super_admin`, `branch_manager` | Filter: `role`, `branchId`, `isActive` |
| `GET /api/users/:id` | auth | |
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
| `GET /api/sales` | auth | Filter `branchId`, `from`, `to`, `status`; paginated |
| `GET /api/sales/:id` | auth | |
| `GET /api/sales/summary` | `super_admin`, `branch_manager` | Aggregated totals + payment mix |
| `POST /api/sales` | auth | Create a sale (branch resolved server-side; auto-links to open shift) |
| `POST /api/sales/:id/return` | auth | Process a return/refund (transactional; restocks items) |

### Reports
| Method & path | Roles | Notes |
|---|---|---|
| `GET /api/reports/dashboard` | `super_admin`, `branch_manager` | Revenue, top products, revenue-by-branch, payment mix, low-stock alert; filter `branchId`, `from`, `to` |

### Shifts
| Method & path | Roles | Notes |
|---|---|---|
| `POST /api/shifts/open` | auth | Open a register shift (`openingBalance`) |
| `GET /api/shifts/active` | auth | Currently open shift(s) for a branch |
| `GET /api/shifts/:id/summary` | auth | Sales/refund totals + expected drawer balance |
| `POST /api/shifts/:id/close` | auth | Close with `closingBalance`; computes `discrepancy` |

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
- **Transactions**: any operation that mutates `Inventory` alongside another
  model (sale, PO receive, transfer receive, manual adjust, return) runs inside a
  single Mongoose session and commits atomically.
- **Audit trail**: every inventory mutation writes an `InventoryLog` row
  (type, signed change, reference, user, reason) inside the same transaction.
