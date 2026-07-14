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

```json
{
  "success": true,
  "message": "Sign In successful.",
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
  "message": "If the account exists, a new OTP has been dispatched."
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

## 3. Core Database Transactions Reference

Below are the exact execution parameters bound to the Neon Serverless engine.

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
| Unique Key Collision | Registered Email or Username exists | 400 Bad Request | `{ success: false, message: "Username or Email already exists." }` |
| Expired / Bad Code | Verification token mismatch or timing timeout | 400 Bad Request | `{ success: false, message: "Invalid or expired verification code." }` |
| Database Pool Timeout | Cloud serverless instance timeout | 500 Server Error | `{ success: false, message: "An error occurred..." }` |
| Uncaught Server Error | Global catch block interception | 500 Server Error | `{ success: false, message: "Internal Server Error" }` |