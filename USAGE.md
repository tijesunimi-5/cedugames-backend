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
   3. Async Execution ──► (Password hashing, DB queries, JWT generation)
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
  "username": "toluwanimi",
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
    "username": "toluwanimi",
    "email": "tolu@cedugames.com",
    "role": "user"
  }
}
```

**Error Response — Sample Collisions & Validations (400 Bad Request)**

```json
{
  "success": false,
  "message": "Username or Email already exists."
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
    "username": "toluwanimi",
    "email": "tolu@cedugames.com",
    "role": "user"
  }
}
```

**Generic Error Response (401 Unauthorized)**

> Note: Mitigates account enumeration security risks by returning ambiguous messages.

```json
{
  "success": false,
  "message": "Invalid Email or Password."
}
```

---

## 3. Core Database Transactions Reference

Below are the exact execution parameters bound to the Neon Serverless engine via parameterized connection pool states.

**Account Ingestion Query**

```sql
INSERT INTO users (id, name, username, email, password, age, role, total_xp, coins_count, lives_remaining, created_at, updated_at)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'user', 0, 100, 3, NOW(), NOW())
RETURNING id, name, username, email, role;
```

**Secured One-Time-Password (OTP) Seeding & Upsert**

```sql
INSERT INTO otps (email, otp_code, purpose, expires_at)
VALUES ($1, $2, 'register', NOW() + INTERVAL '15 minutes')
ON CONFLICT ON CONSTRAINT unique_email_purpose DO UPDATE
SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at, is_used = false;
```

---

## 4. Centralized Error Mapping Standards

All anomalous events thrown down the request pipeline map through the global handler middleware to maintain a unified contract with the frontend clients:

| Error Type | Simulated Condition | HTTP Status | Response Object Structure |
|---|---|---|---|
| Zod ValidationError | Client passes password with < 6 characters | 400 Bad Request | `{ success: false, errors: [...] }` |
| JSON Syntax Error | Malformed JSON structural strings passed | 400 Bad Request | `{ success: false, message: "Invalid JSON format payload provided." }` |
| Unique Key Collision | Registered Email or Username exists | 400 Bad Request | `{ success: false, message: "Username or Email already exists." }` |
| Database Pool Timeout | Cloud serverless instance timeout | 500 Server Error | `{ success: false, message: "An error occurred..." }` |