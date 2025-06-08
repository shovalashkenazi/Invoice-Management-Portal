# 📊 Nimble - Invoice Dashboard (Fullstack Assignment)

This project is a fullstack solution for managing and analyzing invoice data.  
It includes a NestJS + PostgreSQL backend and a React + TypeScript frontend, with support for CSV import, data aggregation, filtering, and interactive visualizations.

## 🧩 Tech Stack

- **Frontend**: React, TypeScript, Chakra UI, Axios, Recharts
- **Backend**: NestJS, Prisma ORM, PostgreSQL
- **Dev Tools**: TO DO
- **Testing**:TO DO

## 🚀 Features

### ✅ CSV Upload

- Upload a CSV of invoices via a dedicated API.
- Automatically parses and normalizes data into `Invoice` and `Supplier` tables.

### 📈 Dashboard Visualizations

- Pie chart of invoice totals by status (`CONFIRMED`, `PENDING`, `CANCELLED`)
- Line/Area chart showing overdue invoice trends over time
- Monthly invoice totals (bar or line)
- Customer-wise totals (horizontal bar chart)

### 🔍 Filtering

- Filter by:
  - Date range
  - Invoice status
  - Customer

### ⚙️ Business Logic

- Invoices flagged as **Overdue** if:
  - `invoice_due_date` has passed
  - AND status ≠ `CONFIRMED`
- Aggregation logic by:

  - Status
  - Customer
  - Month

  ## 🧠 Assumptions & Decisions

- CSV contains only two invoice statuses: `CONFIRMED`, `CANCELLED`.  
  A custom `PENDING` status was introduced to enable full flow per assignment instructions.
- Mapping:
  - `CONFIRMED` → Paid
  - `CANCELLED` → Cancelled
  - `PENDING` → Pending (manually introduced)
- Overdue definition: `invoice_due_date < today` **AND** status ≠ `CONFIRMED`
- Normalized schema: `Supplier` and `Invoice` are stored in separate tables with relations.

## 🛠️ Setup Instructions
