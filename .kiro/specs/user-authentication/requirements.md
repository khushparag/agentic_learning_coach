# Requirements Document: User Authentication System

## Current State Analysis

### What Exists
- **Frontend UI Components** ✅
  - `Register.tsx` - Complete registration form with validation
  - `Login.tsx` - Complete login form
  - Form validation, password visibility toggle, error display
  
- **Frontend Auth Context** ⚠️ (Mock Implementation)
  - `AuthContext.tsx` - State management for authentication
  - `register()` and `login()` functions exist but have `// TODO: Implement actual API call`
  - Users stored only in `localStorage` and `sessionStorage`
  - No actual HTTP requests to backend
  
- **Backend User Repository** ⚠️ (Partial)
  - `postgres_user_repository.py` - Has `create_user()` method
  - No password hashing methods
  - No authentication-related methods (verify_password, etc.)
  
- **Database Schema** ⚠️ (Incomplete)
  - `users` table exists with basic fields
  - Missing `password_hash` column
  - Missing `last_login` column

### What's Missing
- ❌ Backend authentication endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`)
- ❌ Password hashing service (bcrypt)
- ❌ JWT token generation and validation
- ❌ Rate limiting middleware
- ❌ Token blacklist table (for logout)
- ❌ Database migration for authentication fields
- ❌ Frontend API service for authentication
- ❌ Axios interceptor for adding auth tokens to requests

### The Problem
**Users are NOT persisted to the database.** When you register:
1. Frontend creates a mock user in memory
2. Stores a fake token in localStorage
3. No HTTP request is made to the backend
4. No database record is created
5. Refreshing the page loses all data
6. Same email can be "registered" infinite times

## Introduction

The Learning Coach application currently uses mock authentication that doesn't persist users to the database. This allows the same email to be registered multiple times and provides no real security. We need to implement a proper authentication system with user registration, login, and session management.

## Glossary

- **User**: A person who uses the Learning Coach application
- **Authentication**: The process of verifying a user's identity
- **Session**: A period of authenticated access to the application
- **Token**: A cryptographic string used to maintain authentication state
- **Password_Hash**: A one-way encrypted version of a user's password

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to create an account with my email and password, so that I can access the learning platform.

#### Acceptance Criteria

1. WHEN a user submits valid registration data (name, email, password), THE System SHALL create a new user record in the database
2. WHEN a user attempts to register with an existing email, THE System SHALL return an error message indicating the email is already registered
3. WHEN a user's password is stored, THE System SHALL hash the password using bcrypt or similar secure algorithm
4. WHEN registration is successful, THE System SHALL return an authentication token
5. THE System SHALL validate that email addresses follow standard email format
6. THE System SHALL require passwords to be at least 8 characters long
7. WHEN a new user is created, THE System SHALL set isOnboardingComplete to false

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my learning progress.

#### Acceptance Criteria

1. WHEN a user submits valid credentials (email and password), THE System SHALL verify the password against the stored hash
2. WHEN credentials are valid, THE System SHALL return an authentication token and user profile data
3. WHEN credentials are invalid, THE System SHALL return an error message without revealing whether the email exists
4. THE System SHALL implement rate limiting to prevent brute force attacks (max 5 attempts per 15 minutes per IP)
5. WHEN a user logs in successfully, THE System SHALL update the last_login timestamp

### Requirement 3: Session Management

**User Story:** As a logged-in user, I want my session to persist across page refreshes, so that I don't have to log in repeatedly.

#### Acceptance Criteria

1. WHEN a user logs in or registers, THE System SHALL generate a JWT token with 7-day expiration
2. THE Token SHALL include user_id, email, and isOnboardingComplete claims
3. WHEN a user makes an authenticated request, THE System SHALL validate the token
4. WHEN a token is expired, THE System SHALL return a 401 Unauthorized error
5. WHEN a user logs out, THE System SHALL invalidate the token (add to blacklist or use short-lived tokens with refresh)

### Requirement 4: Password Security

**User Story:** As a user, I want my password to be stored securely, so that my account is protected.

#### Acceptance Criteria

1. THE System SHALL use bcrypt with a cost factor of at least 12 for password hashing
2. THE System SHALL never log or expose passwords in plain text
3. THE System SHALL never return password hashes in API responses
4. WHEN a user changes their password, THE System SHALL require the current password for verification

### Requirement 5: User Profile Retrieval

**User Story:** As a logged-in user, I want to retrieve my profile information, so that the app can display my progress and settings.

#### Acceptance Criteria

1. WHEN an authenticated user requests their profile, THE System SHALL return user data including id, email, name, level, and isOnboardingComplete
2. THE System SHALL not return sensitive data like password hashes
3. WHEN a user's token is invalid, THE System SHALL return a 401 Unauthorized error

### Requirement 6: Email Uniqueness

**User Story:** As a system administrator, I want to ensure each email can only be registered once, so that users have unique accounts.

#### Acceptance Criteria

1. THE Database SHALL enforce a unique constraint on the email column
2. WHEN a duplicate email registration is attempted, THE System SHALL return a 409 Conflict error
3. THE System SHALL perform case-insensitive email comparison (user@example.com = USER@EXAMPLE.COM)

### Requirement 7: Frontend Integration

**User Story:** As a developer, I want the frontend to properly integrate with the authentication API, so that users have a seamless experience.

#### Acceptance Criteria

1. WHEN a user registers, THE Frontend SHALL call the POST /api/auth/register endpoint
2. WHEN a user logs in, THE Frontend SHALL call the POST /api/auth/login endpoint
3. WHEN a user logs out, THE Frontend SHALL call the POST /api/auth/logout endpoint
4. THE Frontend SHALL store the authentication token in localStorage
5. THE Frontend SHALL include the token in the Authorization header for all authenticated requests
6. WHEN a 401 error is received, THE Frontend SHALL redirect to the login page and clear stored credentials

### Requirement 8: Error Handling

**User Story:** As a user, I want clear error messages when authentication fails, so that I know how to fix the problem.

#### Acceptance Criteria

1. WHEN registration fails due to duplicate email, THE System SHALL return "Email already registered"
2. WHEN login fails due to invalid credentials, THE System SHALL return "Invalid email or password"
3. WHEN validation fails, THE System SHALL return specific field errors (e.g., "Password must be at least 8 characters")
4. WHEN rate limiting is triggered, THE System SHALL return "Too many attempts. Please try again in X minutes"
5. THE System SHALL use appropriate HTTP status codes (400 for validation, 401 for auth, 409 for conflict, 429 for rate limit)
