# Textiles CRM Backend

## Setup Instructions

1. Install dependencies:

   ```
   npm install
   ```

2. Configure database connection in `src/config/database.ts`.

3. Synchronize database schema:

   ```
   npm run sync-db
   ```

   Note: This will create all necessary database tables.

4. Start the development server:
   ```
   npm run dev
   ```

## API Documentation

The API provides endpoints for:

- User authentication
- Organization management
- Vendor applications
- Address management
- Product management
- Order management

Each endpoint is documented within its controller.

## Environment Variables

Create a `.env` file with the following variables:

- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `PORT` - Server port (default: 9000)
