# CeduGames Backend Core Implementation & Usage Guide

This document outlines the standard implementation architectures, operational patterns, and response handling paradigms for the core authentication and lifecycle endpoints of the CeduGames backend.

---

## 1. Request Lifecycle Architecture

Every inbound HTTP request to the identity ecosystem undergoes a unified 4-stage processing lifecycle:

```text
  [ Inbound Request ]
          │
          ▼
   1. Body Parsing ──► (Validates JSON syntax via Express parser)
          │
          ▼
   2. Data Validation ──► (Structural constraint check via Zod Schema)
          │
          ▼
   3. Async Execution ──► (Password hashing, DB queries, Mailer dispatch, JWT generation)
          │
          ▼
  [ Outbound Response ] ──► (Unified JSON payload or Global Error Interception)
```

---

## 2. Implemented API Endpoint Specifications

### Public Endpoints

### 🔑 User Registration

- **Endpoint:** `POST /auth/user/register`
- **Access Level:** Public
- **Business Logic:** Validates the player's structural requirements, proactively inspects database tables for existing identifier collisions, hashes passwords using a workload factor of 10 (bcrypt), creates the persistent database entries, and initializes a default 6-digit activation code (OTP) with a 15-minute expiration timestamp.

**Request Payload (JSON)**

```json
{
  "name": "Adeniyi Tolu",
  "username": "toluwa24",
  "email": "tolu@cedugames.com",
  "password": "securePlayerPassword123",
  "age": 21
}
```

**Success Response (201 Created)**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "name": "Adeniyi Tolu",
    "username": "toluwa24",
    "email": "tolu@cedugames.com",
    "role": "user"
  }
}
```

**Error Response — Email Collision (400 Bad Request)**

```json
{
  "success": false,
  "message": "An account with this email already exists."
}
```

**Error Response — Username Collision (400 Bad Request)**

```json
{
  "success": false,
  "message": "This username is already taken."
}
```

> Note: the collision check runs `email` first, so if both the email and username collide, the email message wins.

---

### 🔓 User & Admin Authentication

- **Endpoint:** `POST /auth/login`
- **Access Level:** Public
- **Business Logic:** Pulls account entities securely matching the input parameters, validates the user status via an asymmetric verification routine (`comparePassword`), generates signed authentication web tokens, and responds with a role-based context definition block.

**Request Payload (JSON)**

```json
{
  "email": "tolu@cedugames.com",
  "password": "securePlayerPassword123"
}
```

**Success Response (200 OK)**

> Note: unlike registration, the login response `user` object currently returns only `name`, `username`, and `email` — `id` and `role` are not included.

```json
{
  "success": true,
  "message": "Sign In successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "name": "Adeniyi Tolu",
    "username": "toluwa24",
    "email": "tolu@cedugames.com"
  }
}
```

**Error Response — Account Not Found (404 Not Found)**

```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

**Error Response — Password Mismatch (401 Unauthorized)**

```json
{
  "success": false,
  "message": "Invalid Password!"
}
```

---

### 🌐 Google OAuth Authentication

- **Endpoint:** `POST /auth/google`
- **Access Level:** Public
- **Business Logic:** Receives an incoming Google `idToken` from the client, securely verifies its authenticity using the `google-auth-library` against our `GOOGLE_CLIENT_ID`, and extracts the profile data. It performs an upsert transaction — instantly logging them in if their email exists, or registering them with a fallback randomized username if they are a first-time player.

**Request Payload (JSON)**

```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsImtpZCI6ImU3Y..."
}
```

---

### 📩 Forgot Password (OTP Initialization)

- **Endpoint:** `POST /auth/forgot-password`
- **Access Level:** Public
- **Business Logic:** Safely normalizes the incoming email (lowercases and trims). If the account exists, it generates a cryptographically random 6-digit numeric OTP and writes it to the database with a purpose scope of `password_reset`.

**Request Payload (JSON)**

```json
{
  "email": "tolu@cedugames.com"
}
```

---

### 🔄 Resend OTP

- **Endpoint:** `POST /auth/resend-otp`
- **Access Level:** Public
- **Business Logic:** Dynamically handles code regenerations. Accepts a context-driven `purpose` flag to distinguish between registration workflows and password recovery. Regenerates the code string, extends the expiration block by another 15 minutes, clears the `is_used` status back to `false`, and triggers a fresh email dispatch via Brevo.

**Request Payload (JSON)**

```json
{
  "email": "tolu@cedugames.com",
  "purpose": "register"
}
```

> Note: Value for `purpose` can be either `"register"` or `"password_reset"`.

**Success Response (200 OK)**

```json
{
  "success": true,
  "message": "If the account exists, a new otp has been sent."
}
```

---

### 🛡️ Generic OTP Verification

- **Endpoint:** `POST /auth/verify-otp`
- **Access Level:** Public
- **Business Logic:** A centralized, blind verification handler. Validates data based on the provided `purpose`.
  - If verifying a `register` purpose, it immediately sets `is_verified = true` on the user account and destroys the used token.
  - If verifying a `password_reset` purpose, it returns a temporary short-lived `resetToken` granting permission to hit the final recovery step.

**Request Payload (JSON)**

```json
{
  "email": "tolu@cedugames.com",
  "otp": "654321",
  "purpose": "password_reset"
}
```

> ⚠️ Known quirk: this route validates with `VerifyOtpSchema.parse()` (not `.safeParse()`), so a malformed payload throws and falls through to the generic catch block — the client receives `500 { success: false, message: "An error occured. Try again later!" }` instead of the usual `400` Zod error shape. Worth aligning with the other routes' `.safeParse()` pattern.

**Success Response — Registration Purpose (200 OK)**

```json
{
  "success": true,
  "message": "Account verified successfully. You can now log in."
}
```

**Success Response — Password Reset Purpose (200 OK)**

```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC..."
}
```

---

### Protected Endpoints

*Require a valid Bearer token (validated via `verifyPlayerToken`) in the `Authorization` header.*

### 🔐 Authenticated Direct Password Update (Dashboard Flow)

- **Endpoint:** `POST /auth/update-password`
- **Access Level:** Protected (Requires Valid Bearer Token via `verifyPlayerToken`)
- **Business Logic:** Extracts the unique player ID directly from the active session context, reads their profile record, and requires the user to submit their `currentPassword` to prevent unauthorized adjustments if a machine is left unattended.

**Request Payload (JSON)**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "brandNewPassword2026"
}
```

**Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Password updated successfully."
}
```

**Error Response — Wrong Password (401 Unauthorized)**

```json
{
  "success": false,
  "message": "Current password is incorrect."
}
```

**Error Response — Account Missing (404 Not Found)**

```json
{
  "success": false,
  "message": "User not found."
}
```

---

### 🔄 Recovery-Token Password Reset (Forgot Password Flow)

- **Endpoint:** `POST /auth/reset-password`
- **Access Level:** Semi-public — does **not** use `verifyPlayerToken`. Instead the recovery `resetToken` issued by `/auth/verify-otp` (purpose: `password_reset`) is passed as a Bearer token in the `Authorization` header.
- **Business Logic:** Reads the `resetToken` from the `Authorization: Bearer <token>` header (not the JSON body), verifies it with `jwt.verify`, and confirms the payload's `target` claim equals `"recovery"`. On success it updates the account tied to the token's embedded email and deletes the spent `password_reset` OTP row.

**Request Headers**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...
```

**Request Payload (JSON)**

```json
{
  "newPassword": "myNewSecurePassword2026"
}
```

**Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Password reset successful. You can now log in."
}
```

**Error Response — Missing Token (401 Unauthorized)**

```json
{
  "success": false,
  "message": "Missing recovery session token."
}
```

**Error Response — Wrong Token Scope (403 Forbidden)**

```json
{
  "success": false,
  "message": "Invalid token scope for password reset."
}
```

> Note: this fires if a valid JWT is presented but its `target` claim isn't `"recovery"` — e.g. someone tries to reuse a normal login token here.

---

## 3. Core Database Transactions Reference

Below are the exact execution parameters bound to the Neon Serverless engine.

**Duplicate Collision Check (Registration)**

```sql
SELECT email, username FROM users WHERE email = $1 OR username = $2;
```

**Account Ingestion Query**

```sql
INSERT INTO users (id, name, username, email, password, age, role, total_xp, coins_count, lives_remaining, created_at, updated_at)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'user', 0, 100, 3, NOW(), NOW())
RETURNING id, name, username, email, role;
```

**Registration OTP Upsert**

```sql
INSERT INTO otps (email, otp_code, purpose, expires_at)
VALUES ($1, $2, 'register', NOW() + INTERVAL '15 minutes')
ON CONFLICT (email, purpose) DO UPDATE
SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at, is_used = false;
```

**Login Lookup Query**

```sql
SELECT id, name, username, email, password, role FROM users WHERE email = $1;
```

**Google OAuth Upsert Pipeline**

```sql
INSERT INTO users (name, username, email, role, is_oauth)
VALUES ($1, $2, $3, 'user', true)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name, is_oauth = true
RETURNING id, name, username, email, role;
```

**Forgot-Password OTP Upsert**

```sql
INSERT INTO otps (email, otp_code, purpose, expires_at)
VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '15 minutes')
ON CONFLICT (email, purpose) DO UPDATE
SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at, is_used = false;
```

**Dynamic Generic OTP Verification & Filtering Loop**

```sql
SELECT id FROM otps
WHERE email = $1
  AND otp_code = $2
  AND purpose = $3
  AND is_used = false
  AND expires_at > NOW();
```

**Dynamic Resend/Reset OTP Upsert Engine**

```sql
INSERT INTO otps (email, otp_code, purpose, expires_at)
VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')
ON CONFLICT (email, purpose) DO UPDATE
SET
  otp_code = EXCLUDED.otp_code,
  expires_at = EXCLUDED.expires_at,
  is_used = false,
  created_at = NOW();
```

**Registration Verification Side Effects** *(runs on `verify-otp` with `purpose: "register"`)*

```sql
UPDATE users SET is_verified = true WHERE email = $1;

DELETE FROM otps WHERE email = $1 AND purpose = 'register';
```

**Password-Reset OTP Burn** *(runs on `reset-password` after a successful token verification)*

```sql
DELETE FROM otps WHERE email = $1 AND purpose = 'password_reset';
```

---

## 4. Required Mailing Infrastructure Configuration

The outbound transactional notification handler leverages Brevo's SMTP relay service. Developers must guarantee that local configuration systems include these active keys:

```
BREVO_API_KEY=your_secret_brevo_api_key_here
SENDER_EMAIL=no-reply@cedugames.com
```

---

## 5. Centralized Error Mapping Standards

All anomalous events thrown down the request pipeline map through the global handler middleware to maintain a unified contract with the frontend clients:

| Error Type | Simulated Condition | HTTP Status | Response Object Structure |
|---|---|---|---|
| Zod ValidationError | Client passes input missing required parameters | 400 Bad Request | `{ success: false, errors: [...] }` |
| JSON Syntax Error | Malformed JSON structural strings passed | 400 Bad Request | `{ success: false, message: "Invalid JSON format payload provided." }` |
| Unique Key Collision | Registered email already exists | 400 Bad Request | `{ success: false, message: "An account with this email already exists." }` |
| Unique Key Collision | Registered username already exists | 400 Bad Request | `{ success: false, message: "This username is already taken." }` |
| Expired / Bad Code | Verification token mismatch or timing timeout | 400 Bad Request | `{ success: false, message: "Invalid or expired verification code." }` |
| Database Pool Timeout | Cloud serverless instance timeout | 500 Server Error | `{ success: false, message: "An error occurred..." }` |
| Uncaught Server Error | Global catch block interception | 500 Server Error | `{ success: false, message: "Internal Server Error" }` |