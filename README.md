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

### Business Logic

- **Data Aggregation**: Efficient aggregation by status, month, and customer
- **Upload CSV**: complete..
- **Filtering**: complete..

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

### Frontend Architecture

- **Component-Based**: Modular, reusable React components
- **Custom Hooks**: Separation of business logic from UI components
- **Responsive Design**: Mobile-friendly interface with Chakra UI
- **State Management**: Local state with React hooks for optimal performance
