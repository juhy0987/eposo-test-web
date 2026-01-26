# Eposo Test Application

A full-stack application with authentication features including user signup, login with JWT tokens, and session management.

## Project Structure

```
├── eposo-test-api/          # NestJS Backend API
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── prisma/         # Database service
│   │   └── main.ts         # Application entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
├── eposo-test-web/         # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app component
│   └── package.json
│
└── vercel.json             # Vercel deployment configuration
```

## Features

### Backend (eposo-test-api)
- ✅ User signup with email and password
- ✅ User login with JWT authentication
- ✅ Access token (1-hour expiry) returned in response body
- ✅ Refresh token (14-day expiry) stored in secure HttpOnly cookie
- ✅ Account locking after 5 failed login attempts (10-minute lockout)
- ✅ Distinct error messages for invalid credentials vs. non-existent accounts
- ✅ Logout endpoint that clears refresh token cookie
- ✅ Password hashing with bcrypt
- ✅ PostgreSQL database with Prisma ORM

### Frontend (eposo-test-web)
- ✅ Sign up page with form validation
- ✅ Login page with controlled inputs
- ✅ Password visibility toggle
- ✅ Auto-login checkbox (default checked)
- ✅ Specific error messages displayed under relevant fields
- ✅ Automatic Bearer token attachment to API requests
- ✅ Header with logout button
- ✅ Client-side session management
- ✅ Redirect to login after logout

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database

### Backend Setup

1. Navigate to the API directory:
   ```bash
   cd eposo-test-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   JWT_ACCESS_SECRET="your-access-token-secret-key"
   JWT_REFRESH_SECRET="your-refresh-token-secret-key"
   ```

4. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

5. Start the development server:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the web directory:
   ```bash
   cd eposo-test-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The web app will be available at `http://localhost:5173`

## API Documentation

See [API_DOCS.md](./eposo-test-api/API_DOCS.md) for detailed API endpoint documentation.

### Key Endpoints

- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Authenticate user and receive tokens
- `POST /auth/logout` - Clear refresh token cookie

## Authentication Flow

1. **Sign Up:** User creates account with email and password
2. **Login:** User authenticates and receives:
   - Access token (stored in localStorage)
   - Refresh token (stored in HttpOnly cookie)
3. **Auto-Login:** If enabled, user stays logged in across sessions
4. **Authenticated Requests:** Access token automatically attached as Bearer token
5. **Logout:** Clears all session data and redirects to login

## Security Features

### Account Protection
- Account locked for 10 minutes after 5 consecutive failed login attempts
- Failed attempt counter displayed to user
- Automatic unlock after timeout period

### Token Management
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (14 days) in HttpOnly cookies
- Secure cookie configuration (HTTPS in production)
- SameSite: Strict to prevent CSRF attacks

### Password Security
- Minimum 8 characters required
- Bcrypt hashing with salt rounds
- Passwords never returned in API responses

## Database Schema

```prisma
model User {
  id                  Int       @id @default(autoincrement())
  email               String    @unique
  password            String
  failedLoginAttempts Int       @default(0)
  accountLockedUntil  DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

## Deployment

This project is configured for Vercel deployment. The `vercel.json` file contains the necessary configuration for both frontend and backend.

### Environment Variables for Production

Set these in your Vercel project settings:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret key for access tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens

## Technologies Used

### Backend
- NestJS - Progressive Node.js framework
- Prisma - Next-generation ORM
- PostgreSQL - Relational database
- JWT - JSON Web Tokens for authentication
- Bcrypt - Password hashing
- Cookie-parser - Cookie handling middleware

### Frontend
- React - UI library
- React Router - Client-side routing
- Axios - HTTP client
- Vite - Build tool and dev server

## Future Enhancements

- [ ] Email verification on signup
- [ ] Password reset functionality
- [ ] Refresh token rotation
- [ ] Remember me on different devices
- [ ] Two-factor authentication
- [ ] Session management dashboard
- [ ] Password strength requirements
- [ ] Rate limiting on login attempts
