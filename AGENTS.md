# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Running the Application
- **Development server with auto-reload**: `npm run dev`
  - Uses Node's `--watch` flag for automatic restarts on file changes
  - Server runs on port 3000 by default (configurable via PORT in .env)

### Code Quality
- **Linting**: `npm run lint` - Check for code style issues
- **Auto-fix linting**: `npm run lint:fix` - Automatically fix linting issues
- **Format code**: `npm run format` - Format all files with Prettier
- **Check formatting**: `npm run format:check` - Verify formatting without changes

### Database Operations (Drizzle ORM)
- **Generate migrations**: `npm run db:generate` - Create migration files from schema changes
- **Run migrations**: `npm run db:migrate` - Apply pending migrations to database
- **Database studio**: `npm run db:studio` - Open Drizzle Studio for database browsing

Database is PostgreSQL via Neon serverless, configured in `drizzle.config.js`. Schema files are in `src/models/*.js`.

## Architecture Overview

### Project Structure
This is an Express.js REST API using ES6 modules with Node's import map aliases (`#config`, `#models`, etc.) defined in package.json.

**Entry Point Flow**:
1. `src/index.js` - Loads environment variables and imports server
2. `src/server.js` - Starts Express server on configured PORT
3. `src/app.js` - Express application setup with middleware and routes

**Core Layers**:
- **Routes** (`src/routes/`) - Express route definitions, map endpoints to controllers
- **Controllers** (`src/controllers/`) - Handle HTTP requests/responses, validate input with Zod schemas
- **Services** (`src/services/`) - Business logic and database operations
- **Models** (`src/models/`) - Drizzle ORM schema definitions (PostgreSQL tables)
- **Validations** (`src/validations/`) - Zod schemas for request validation
- **Utils** (`src/utils/`) - Shared utilities (JWT, cookies, formatting)
- **Config** (`src/config/`) - Database connection and Winston logger setup

### Key Technical Decisions

**Database Layer**: Uses Drizzle ORM with Neon serverless PostgreSQL. Database instance `db` is exported from `#config/database.js`. Queries use Drizzle's query builder (e.g., `db.select().from(users).where(eq(users.email, email))`).

**Authentication Flow**: JWT tokens stored in HTTP-only cookies. Token generation in `#utils/jwt.js`, cookie management in `#utils/cookies.js`. Controllers handle auth endpoints, services manage password hashing with bcrypt and user CRUD.

**Logging**: Winston logger configured in `#config/logger.js`. Logs to `logs/error.lg` and `logs/combined.log` files. Console transport added in non-production. Morgan middleware pipes HTTP logs through Winston.

**Validation**: Zod schemas in `src/validations/` validate request bodies. Controllers use `.safeParse()` and return formatted errors via `formatValidationError()` utility.

**Middleware Stack**: helmet (security headers), cors, express.json/urlencoded, cookie-parser, morgan (HTTP logging).

### Code Style Conventions
- ESLint config enforces: 2-space indentation, single quotes, semicolons, prefer const/arrow functions
- Use import map aliases (e.g., `import logger from '#config/logger.js'`) instead of relative paths
- Always include `.js` extension in imports (ES modules requirement)
- Unused function parameters should be prefixed with underscore (e.g., `_req`)

### Known Issues
- `src/routes/auth.routes.js` has incomplete implementations: `/sign-in` and `/sign-out` routes return placeholder responses but corresponding controller functions (`signIn`, `signOut`) are implemented and unused
- Logger config has typo: error log file is `logs/error.lg` (should likely be `.log`)
