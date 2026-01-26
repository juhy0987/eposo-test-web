# API Documentation

## Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "passwordConfirmation": "password123"
}
```

**Success Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- 409 Conflict: Email already in use
- 400 Bad Request: Validation errors (password mismatch, invalid email, etc.)

---

### POST /auth/login
Authenticate a user and receive access and refresh tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Response Headers:**
- `Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=1209600`

**Error Responses:**
- 401 Unauthorized: "No account found with this email address."
- 401 Unauthorized: "Invalid password. X attempt(s) remaining before account lock."
- 401 Unauthorized: "Account locked for 10 minutes due to too many failed login attempts."
- 401 Unauthorized: "Account is locked due to too many failed login attempts. Please try again in X minute(s)."

**Security Features:**
- Access token expires in 1 hour
- Refresh token expires in 14 days (stored in HttpOnly cookie)
- Account locked for 10 minutes after 5 consecutive failed login attempts
- Failed login attempts are reset upon successful login
- Distinct error messages for non-existent accounts vs. invalid passwords

---

### POST /auth/logout
Logout a user by clearing the refresh token cookie.

**Request:**
No body required. Must include cookies in request.

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Response Headers:**
- `Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0` (clears the cookie)

---

## Authentication Flow

1. **Sign Up:** Create a new account via `/auth/signup`
2. **Login:** Authenticate via `/auth/login` to receive:
   - Access token (in response body) - valid for 1 hour
   - Refresh token (in HttpOnly cookie) - valid for 14 days
3. **Authenticated Requests:** Include access token in Authorization header:
   ```
   Authorization: Bearer <accessToken>
   ```
4. **Logout:** Call `/auth/logout` to clear refresh token cookie

---

## Security Considerations

### Account Locking
- After 5 failed login attempts, the account is locked for 10 minutes
- Countdown shows remaining time when attempting to login during lock period
- Failed attempts counter resets upon successful login
- Account automatically unlocks after 10 minutes

### Token Management
- **Access Token:** Short-lived (1 hour), sent in response body, stored on client
- **Refresh Token:** Long-lived (14 days), stored in HttpOnly cookie, cannot be accessed by JavaScript
- Refresh tokens are automatically sent with requests via cookies
- Access tokens must be manually attached to Authorization header

### Password Requirements
- Minimum 8 characters
- No specific complexity requirements (can be enhanced as needed)

### CORS Configuration
- Credentials (cookies) are enabled
- Configure allowed origins for production deployment

---

## Environment Variables

Required environment variables in `.env`:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
JWT_ACCESS_SECRET="your-access-token-secret-key"
JWT_REFRESH_SECRET="your-refresh-token-secret-key"
```

**Important:** Change JWT secrets in production to secure random strings.
