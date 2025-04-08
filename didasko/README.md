# Didasko - Academic Management System

A modern academic management system built with Next.js, Prisma, and PostgreSQL.

## Features

- Role-based authentication (Admin, Faculty, Academic Head)
- Microsoft 365 email integration
- Dashboard for each user role
- Course management
- Weekly schedule

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL 12.x or later
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/didasko.git
   cd didasko
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables: Create a `.env` file in the root directory with
   the following variables:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/didasko_db?schema=public"
   JWT_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"
   ```

4. Set up the database:

   ```bash
   npm run db:setup
   # or
   yarn db:setup
   ```

   This will generate the Prisma client, run migrations, and seed the database
   with initial users.

5. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication

The system uses JWT-based authentication with role-based access control. Users
can log in with their Microsoft 365 email addresses.

### Test Users

For testing purposes, the following users are created during seeding:

- Admin: admin@example.com
- Faculty: faculty@example.com
- Academic Head: academic@example.com

## Project Structure

- `src/app` - Next.js app router pages
- `src/components` - Reusable UI components
- `src/lib` - Utility functions and shared code
- `prisma` - Database schema and migrations

## License

This project is licensed under the MIT License - see the LICENSE file for
details.
