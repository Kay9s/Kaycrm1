# CarFlow - Car Rental Management System

## Overview

CarFlow is a comprehensive car rental management system with features for managing vehicles, bookings, customers, and support tickets. The application uses a modern tech stack with a React frontend and Express backend, with Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

CarFlow follows a client-server architecture with clear separation between frontend and backend components:

1. **Frontend**: React application with a component-based architecture, utilizing React Query for data fetching and state management.
2. **Backend**: Express.js server providing RESTful API endpoints.
3. **Database**: PostgreSQL database with Drizzle ORM for type-safe database operations.
4. **UI Framework**: Tailwind CSS for styling, complemented by Shadcn UI components.

### Key Design Decisions

- **Full Stack TypeScript**: Both frontend and backend use TypeScript for type safety and better developer experience.
- **Drizzle ORM**: Chosen for its type-safe database operations and schema definitions.
- **React Query**: Used for efficient data fetching, caching, and state management on the frontend.
- **Component Library**: Custom components built on top of Radix UI primitives for accessibility and consistency.

## Key Components

### Frontend

1. **Pages**:
   - Dashboard: Overview of the system with key metrics
   - Bookings: Manage vehicle bookings
   - Fleet: Vehicle inventory management
   - Customers: Customer management
   - Booking Details: Detailed view of a specific booking

2. **Components**:
   - UI Components: Buttons, cards, forms, tables, etc. (built with Shadcn UI)
   - Layout Components: Sidebar, Header, MobileNav for responsive design
   - Feature Components: Booking forms, vehicle cards, customer lists

3. **Utilities**:
   - API client functions
   - Date and currency formatting
   - Theme management

### Backend

1. **API Routes**:
   - `/api/vehicles`: Vehicle management endpoints
   - `/api/customers`: Customer management endpoints
   - `/api/bookings`: Booking management endpoints
   - `/api/support-tickets`: Support ticket management

2. **Storage Layer**:
   - Interface for database operations
   - Implementation using Drizzle ORM

3. **Schema**:
   - Database schema definitions with Drizzle and Zod validation

## Data Flow

1. **Create Booking Flow**:
   - User selects available vehicles for a date range
   - User provides customer information
   - Backend validates data using Zod schemas
   - Booking is created and stored in the database
   - UI updates to reflect the new booking

2. **Vehicle Management Flow**:
   - Admin adds/edits vehicle information
   - Data is validated and saved to the database
   - Vehicle availability is updated in real-time
   - Dashboard metrics reflect inventory changes

3. **Authentication Flow**:
   - Users log in with credentials
   - Backend validates and issues session
   - Protected routes check authentication status
   - Session management for persistent login

## External Dependencies

### Frontend Dependencies

- **@tanstack/react-query**: Data fetching and state management
- **wouter**: Lightweight routing
- **lucide-react**: Icon library
- **date-fns**: Date manipulation
- **Radix UI**: Accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Component library built on Radix UI

### Backend Dependencies

- **Express**: Web server framework
- **Drizzle ORM**: Database ORM
- **Zod**: Schema validation
- **connect-pg-simple**: Session management with PostgreSQL

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Development Mode**:
   - Run with `npm run dev` which uses `tsx` for TypeScript execution
   - Vite dev server with hot module replacement for the frontend
   - Express backend with API routes

2. **Production Build**:
   - Frontend: Built with Vite (`vite build`)
   - Backend: Bundled with esbuild
   - Combined into a single deployment package

3. **Database**:
   - PostgreSQL database provisioned through Replit
   - Connection via environment variables

4. **Environment Configuration**:
   - NODE_ENV for environment detection
   - DATABASE_URL for database connection

## Database Schema

The database schema includes the following main entities:

1. **Users**: System users with authentication data
   - Fields: id, username, password, fullName, email, role, createdAt

2. **Vehicles**: Car inventory
   - Fields: id, make, model, year, licensePlate, category, status, maintenanceStatus, imageUrl, dailyRate

3. **Customers**: Client information
   - Fields: id, fullName, email, phone, address, driverLicense, notes, createdAt

4. **Bookings**: Rental reservations
   - Fields: id, customerId, vehicleId, startDate, endDate, totalAmount, status, bookingRef, createdAt
   
5. **Support Tickets**: Customer support requests
   - Fields: id, customerId, subject, description, status, priority, bookingId, createdAt

## Development Guidelines

1. **Code Structure**:
   - Frontend code in `client/src/`
   - Backend code in `server/`
   - Shared code (like schemas) in `shared/`

2. **API Conventions**:
   - RESTful endpoints under `/api/`
   - JSON response format
   - HTTP status codes for error handling

3. **Database Access**:
   - All database operations through the storage interface
   - No direct database queries in route handlers
   - Schema validation before database operations

4. **UI Components**:
   - Reuse existing Shadcn UI components
   - Follow the established styling patterns
   - Support both light and dark themes