# 📊 Nimble - Invoice Dashboard (Fullstack Assignment)

A fullstack application for managing and analyzing invoice data with interactive visualizations, CSV upload functionality, and real-time filtering capabilities.

## 🧩 Tech Stack

### Frontend

- **React** with TypeScript
- **Chakra UI** for component library and styling
- **Recharts** for data visualizations
- **React Router** for navigation

### Backend

- **NestJS** with TypeScript
- **Prisma ORM** for database operations
- **PostgreSQL** for data storage

## 🚀 Features

### Backend Service

- **CSV Upload API**: Upload and process invoice CSV files with automatic data validation
- **Aggregated Data API**: Retrieve statistics including totals by status, overdue counts, and monthly summaries
- **Filtering API**: Filter data by date range, invoice status, and customer
- **Normalized Database Schema**: Efficient storage with separate Invoice and Supplier tables

### Frontend Dashboard

- **Invoice Status Visualization**: Pie and bar charts showing total amounts by status (Confirmed, Pending, Cancelled)
- **Overdue Trends**: Line and area charts displaying overdue invoice trends over time
- **Monthly Analysis**: Bar and line charts for monthly invoice totals
- **Customer Analysis**: Horizontal bar chart showing total amounts by customer
- **Interactive Filtering**: Filter by date range, status, and customer with real-time updates
- **Chart Type Toggles**: Switch between different visualization types
- **Currency Support**: View data in USD, EUR, or GBP

### Business Logic

- **Overdue Detection**: Automatically flags invoices as overdue based on due date and pending status
- **Data Aggregation**: Efficient aggregation by status, month, and customer
- **Optimized Querying**: Database queries optimized for large datasets

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v15 or higher)
- npm

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration

# Run database migrations
npx prisma migrate dev

# Start the backend server
npm run start:dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API endpoint

# Start the development server
npm run dev
```

## 📊 Using the Application

1. **Upload CSV Data**: Use the upload button in the sidebar to import invoice data
2. **View Dashboard**: Explore various charts showing invoice analytics
3. **Apply Filters**: Use the filter panel to narrow down data by date, status, or customer
4. **Switch Visualizations**: Toggle between different chart types using the control buttons
5. **Change Currency**: Select different currencies to view monetary values

## 🏗️ Architecture & Design Choices

### Database Design

- **Normalized Schema**: Separate tables for Invoices and Suppliers to avoid data duplication
- **Scalable Structure**: Designed to handle large datasets efficiently

### API Design

- **RESTful Endpoints**: Clean, predictable API structure
- **Data Aggregation**: Server-side aggregation for better performance
- **Flexible Filtering**: Query parameters for dynamic filtering

### Frontend Architecture

- **Component-Based**: Modular, reusable React components
- **Custom Hooks**: Separation of business logic from UI components
- **Responsive Design**: Mobile-friendly interface with Chakra UI
- **State Management**: Local state with React hooks for optimal performance

## 📈 Business Logic

### Overdue Invoice Calculation

An invoice is considered overdue if:

- Due date has passed (< current date)
- Status is "PENDING"

### Data Aggregations

- **Status Totals**: Sum of invoice amounts grouped by status
- **Monthly Summaries**: Monthly totals with invoice counts
- **Customer Analysis**: Total amounts per customer with ranking
- **Overdue Trends**: Monthly overdue invoice counts over time
