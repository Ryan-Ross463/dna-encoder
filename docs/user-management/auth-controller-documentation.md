# Authentication Controller Documentation

## 📄 **File**: `src/controllers/auth.controller.ts`

### **Purpose**
The Authentication Controller is the core business logic layer that handles all user authentication operations including signup, login, logout, and token verification. It implements secure password hashing with bcrypt and JWT-based authentication with database-backed token storage for revocation capabilities.

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Helper Functions](#helper-functions)
4. [Controller Functions](#controller-functions)
5. [Security Features](#security-features)
6. [Error Handling](#error-handling)
7. [Database Operations](#database-operations)
8. [Usage Examples](#usage-examples)

---

## 🎯 **Overview**

### **Architecture Pattern**
- **Type**: Controller (MVC Pattern)
- **Layer**: Business Logic Layer
- **Responsibility**: Process authentication requests, validate inputs, manage JWT tokens
- **Dependencies**: Express, bcrypt, jsonwebtoken, User Model, JWTToken Model

### **Key Responsibilities**
1. ✅ User Registration (Signup)
2. ✅ User Authentication (Login)
3. ✅ Session Management (Logout, Logout All)
4. ✅ Token Verification
5. ✅ Input Validation
6. ✅ Password Security
7. ✅ Error Handling

---

## ⚙️ **Configuration**

### **Environment Variables**

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';
const BCRYPT_ROUNDS = 10;
```

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `JWT_SECRET` | string | `'your-secret-key-change-in-production'` | Secret key for signing JWT tokens |
| `JWT_EXPIRATION` | string | `'7d'` | Token expiration time (d=days, h=hours, m=minutes) |
| `BCRYPT_ROUNDS` | number | `10` | Number of salt rounds for bcrypt hashing |

### **Setting Environment Variables**

**`.env` file:**
```env
JWT_SECRET=your-very-secure-random-secret-key-here-min-32-chars
JWT_EXPIRATION=7d
```

**Security Notes:**
- ⚠️ **NEVER** use the default JWT_SECRET in production
- ✅ Generate a strong random secret (minimum 32 characters)
- ✅ Use a key management service (AWS KMS, Azure Key Vault) in production
- ✅ Different secrets for different environments (dev, staging, prod)

---

## 🔧 **Helper Functions**

### **`calculateExpirationDate(expirationString: string): Date`**

Converts a human-readable expiration string into a JavaScript Date object.

#### **Parameters**
- `expirationString` (string): Time format (e.g., "7d", "24h", "30m")

#### **Returns**
- `Date`: Calculated expiration timestamp

#### **Supported Formats**
```typescript
"7d"   → 7 days from now
"24h"  → 24 hours from now
"30m"  → 30 minutes from now
```

#### **Implementation Logic**
```
1. Parse the numeric value (e.g., "7" from "7d")
2. Extract the unit character (e.g., "d" from "7d")
3. Switch on unit:
   - 'd': Add days
   - 'h': Add hours
   - 'm': Add minutes
   - default: Add 7 days (fallback)
4. Return calculated Date object
```

#### **Example**
```typescript
const expiresAt = calculateExpirationDate("7d");
// Returns: Date 7 days from now
// Example: 2025-10-20T10:30:00.000Z
```

---

## 📦 **Controller Functions**

---

## 1️⃣ **SIGNUP** - User Registration

### **Function Signature**
```typescript
export const signup = async (req: Request, res: Response): Promise<Response>
```

### **Endpoint**
```
POST /api/auth/signup
Content-Type: application/json
```

### **Request Body**
```json
{
  "userName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### **Success Response** (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-10-13T10:30:00.000Z"
    }
  }
}
```

### **Validation Rules**

| Field | Rules | Error Code |
|-------|-------|------------|
| `userName` | Required, 3-50 characters | `MISSING_FIELDS`, `INVALID_USERNAME` |
| `email` | Required, Valid format | `MISSING_FIELDS`, `INVALID_EMAIL` |
| `password` | Required, Min 8 characters | `MISSING_FIELDS`, `WEAK_PASSWORD` |
| Email uniqueness | Must not exist | `EMAIL_EXISTS` |

### **Process Flow**

```
┌─────────────────────────────────────────────────────────┐
│ 1. VALIDATE INPUT                                       │
│    ├─ Check required fields (userName, email, password) │
│    ├─ Validate email format (regex)                     │
│    ├─ Validate username length (3-50 chars)             │
│    └─ Validate password strength (min 8 chars)          │
├─────────────────────────────────────────────────────────┤
│ 2. CHECK DUPLICATE                                      │
│    └─ Query database for existing email                 │
│       ├─ If exists → Return 409 EMAIL_EXISTS            │
│       └─ If not exists → Continue                        │
├─────────────────────────────────────────────────────────┤
│ 3. HASH PASSWORD                                        │
│    └─ bcrypt.hash(password, 10)                         │
│       Original: "securePassword123"                     │
│       Hashed:   "$2b$10$KIXz4qJ9k.eYvH1pZJ8MxO..."     │
├─────────────────────────────────────────────────────────┤
│ 4. CREATE USER                                          │
│    ├─ Trim and normalize data                           │
│    │  ├─ userName: trim()                               │
│    │  └─ email: toLowerCase().trim()                    │
│    ├─ Create new User instance                          │
│    └─ Save to database                                  │
│       → Creates "users" collection on first save        │
├─────────────────────────────────────────────────────────┤
│ 5. RETURN RESPONSE                                      │
│    └─ Return user data (WITHOUT password hash)          │
│       Status: 201 Created                               │
└─────────────────────────────────────────────────────────┘
```

### **Error Responses**

#### **Missing Fields** (400)
```json
{
  "success": false,
  "error": {
    "code": "MISSING_FIELDS",
    "message": "Username, email, and password are required"
  }
}
```

#### **Invalid Email** (400)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Please provide a valid email address"
  }
}
```

#### **Invalid Username** (400)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_USERNAME",
    "message": "Username must be between 3 and 50 characters"
  }
}
```

#### **Weak Password** (400)
```json
{
  "success": false,
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password must be at least 8 characters long"
  }
}
```

#### **Email Already Exists** (409)
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists"
  }
}
```

#### **Server Error** (500)
```json
{
  "success": false,
  "error": {
    "code": "SIGNUP_FAILED",
    "message": "Failed to register user",
    "details": "Detailed error message"
  }
}
```

### **Security Features**
- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **Email Normalization**: Lowercase and trim
- ✅ **Data Sanitization**: Trim whitespace from username
- ✅ **Password Never Returned**: Response excludes passwordHash
- ✅ **Duplicate Prevention**: Check before insert

### **Database Impact**
- **Collection Created**: `users` (on first signup)
- **Document Created**: 1 user document
- **Indexes Used**: `email` (unique)

### **Console Logging**
```
[Auth] New user registered: john@example.com
```

---

## 2️⃣ **LOGIN** - User Authentication

### **Function Signature**
```typescript
export const login = async (req: Request, res: Response): Promise<Response>
```

### **Endpoint**
```
POST /api/auth/login
Content-Type: application/json
```

### **Request Body**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### **Success Response** (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJpYXQiOjE2OTcyMDgwMDAsImV4cCI6MTY5NzgxMjgwMH0.signature",
    "expiresIn": "7d",
    "expiresAt": "2025-10-20T10:30:00.000Z",
    "user": {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### **Validation Rules**

| Field | Rules | Error Code |
|-------|-------|------------|
| `email` | Required | `MISSING_CREDENTIALS` |
| `password` | Required | `MISSING_CREDENTIALS` |
| Credentials | Must be valid | `INVALID_CREDENTIALS` |

### **Process Flow**

```
┌─────────────────────────────────────────────────────────┐
│ 1. VALIDATE INPUT                                       │
│    └─ Check required fields (email, password)           │
├─────────────────────────────────────────────────────────┤
│ 2. FIND USER                                            │
│    └─ Query database by email (lowercase)               │
│       ├─ .select('+passwordHash') - Explicitly include  │
│       ├─ If not found → Return 401 INVALID_CREDENTIALS  │
│       └─ If found → Continue                             │
├─────────────────────────────────────────────────────────┤
│ 3. VERIFY PASSWORD                                      │
│    └─ bcrypt.compare(password, user.passwordHash)       │
│       ├─ If invalid → Return 401 INVALID_CREDENTIALS    │
│       └─ If valid → Continue                             │
├─────────────────────────────────────────────────────────┤
│ 4. GENERATE JWT TOKEN                                   │
│    ├─ Create payload: { userId, email }                 │
│    ├─ Sign with JWT_SECRET                              │
│    ├─ Set expiration (JWT_EXPIRATION)                   │
│    └─ Result: "eyJhbGciOi..."                           │
├─────────────────────────────────────────────────────────┤
│ 5. CALCULATE EXPIRATION                                 │
│    └─ calculateExpirationDate(JWT_EXPIRATION)           │
│       Example: 7 days from now                          │
├─────────────────────────────────────────────────────────┤
│ 6. STORE TOKEN IN DATABASE                              │
│    ├─ Create new JWTToken document                      │
│    │  ├─ ownerUserId: user.userId                       │
│    │  ├─ token: tokenString                             │
│    │  └─ expiresAt: calculated date                     │
│    └─ Save to database                                  │
│       → Creates "jwttokens" collection on first login   │
├─────────────────────────────────────────────────────────┤
│ 7. RETURN RESPONSE                                      │
│    └─ Return token and user data                        │
│       Status: 200 OK                                    │
└─────────────────────────────────────────────────────────┘
```

### **JWT Token Structure**

#### **Header**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

#### **Payload**
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "john@example.com",
  "iat": 1697208000,
  "exp": 1697812800
}
```

#### **Signature**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET
)
```

#### **Complete Token**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOi...signature
│                                     │                    │
│          Header (Base64)            │  Payload (Base64)  │ Signature
```

### **Error Responses**

#### **Missing Credentials** (400)
```json
{
  "success": false,
  "error": {
    "code": "MISSING_CREDENTIALS",
    "message": "Email and password are required"
  }
}
```

#### **Invalid Credentials** (401)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Note**: Same error for both "user not found" and "wrong password" to prevent email enumeration attacks.

#### **Server Error** (500)
```json
{
  "success": false,
  "error": {
    "code": "LOGIN_FAILED",
    "message": "Failed to log in",
    "details": "Detailed error message"
  }
}
```

### **Security Features**
- ✅ **Password Verification**: bcrypt.compare() for secure comparison
- ✅ **Email Normalization**: Lowercase for case-insensitive lookup
- ✅ **No Email Enumeration**: Same error for non-existent user and wrong password
- ✅ **Token Storage**: Database-backed for revocation capability
- ✅ **Explicit Select**: passwordHash excluded by default, explicitly included
- ✅ **JWT Signing**: HMAC SHA256 algorithm

### **Database Impact**
- **Collection Created**: `jwttokens` (on first login)
- **Document Created**: 1 token document
- **Queries**: 1 read (User), 1 write (JWTToken)

### **Console Logging**
```
[Auth] User logged in: john@example.com
```

---

## 3️⃣ **LOGOUT** - Single Device Logout

### **Function Signature**
```typescript
export const logout = async (req: Request, res: Response): Promise<Response>
```

### **Endpoint**
```
POST /api/auth/logout
Authorization: Bearer <token>
```

### **Request Headers**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Success Response** (200 OK)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### **Process Flow**

```
┌─────────────────────────────────────────────────────────┐
│ 1. EXTRACT TOKEN                                        │
│    ├─ Get Authorization header                          │
│    ├─ Check format: "Bearer <token>"                    │
│    ├─ Extract token part                                │
│    └─ If invalid → Return 401 NO_TOKEN                  │
├─────────────────────────────────────────────────────────┤
│ 2. FIND TOKEN IN DATABASE                               │
│    └─ Query JWTToken collection by token                │
│       ├─ If not found → Return 404 TOKEN_NOT_FOUND      │
│       └─ If found → Continue                             │
├─────────────────────────────────────────────────────────┤
│ 3. CHECK REVOCATION STATUS                              │
│    └─ If already revoked → Return 400 ALREADY_LOGGED_OUT│
├─────────────────────────────────────────────────────────┤
│ 4. REVOKE TOKEN                                         │
│    └─ Call jwtToken.revoke()                            │
│       ├─ Sets isRevoked = true                          │
│       └─ Updates updatedAt timestamp                    │
├─────────────────────────────────────────────────────────┤
│ 5. RETURN RESPONSE                                      │
│    └─ Return success message                            │
│       Status: 200 OK                                    │
└─────────────────────────────────────────────────────────┘
```

### **Error Responses**

#### **No Token** (401)
```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "No authentication token provided"
  }
}
```

#### **Token Not Found** (404)
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_NOT_FOUND",
    "message": "Token not found"
  }
}
```

#### **Already Logged Out** (400)
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_LOGGED_OUT",
    "message": "You are already logged out"
  }
}
```

#### **Server Error** (500)
```json
{
  "success": false,
  "error": {
    "code": "LOGOUT_FAILED",
    "message": "Failed to log out",
    "details": "Detailed error message"
  }
}
```

### **Security Features**
- ✅ **Token Validation**: Check Authorization header format
- ✅ **Database Verification**: Ensure token exists in database
- ✅ **Idempotent**: Safe to call multiple times
- ✅ **Immediate Effect**: Token invalid after revocation

### **Database Impact**
- **Queries**: 1 read, 1 write (update)
- **Modified Fields**: `isRevoked`, `updatedAt`

### **Console Logging**
```
[Auth] User logged out: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## 4️⃣ **LOGOUT ALL** - Multi-Device Logout

### **Function Signature**
```typescript
export const logoutAll = async (req: Request, res: Response): Promise<Response>
```

### **Endpoint**
```
POST /api/auth/logout-all
Authorization: Bearer <token>
```

### **Request Headers**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Success Response** (200 OK)
```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "data": {
    "tokensRevoked": 5
  }
}
```

### **Process Flow**

```
┌─────────────────────────────────────────────────────────┐
│ 1. EXTRACT TOKEN                                        │
│    ├─ Get Authorization header                          │
│    ├─ Check format: "Bearer <token>"                    │
│    ├─ Extract token part                                │
│    └─ If invalid → Return 401 NO_TOKEN                  │
├─────────────────────────────────────────────────────────┤
│ 2. VERIFY TOKEN & GET USER ID                           │
│    └─ jwt.verify(token, JWT_SECRET)                     │
│       ├─ Decode payload                                 │
│       ├─ Extract userId                                 │
│       ├─ If invalid → Return 401 INVALID_TOKEN          │
│       └─ If valid → Continue                             │
├─────────────────────────────────────────────────────────┤
│ 3. REVOKE ALL USER TOKENS                               │
│    └─ JWTToken.updateMany()                             │
│       ├─ Filter: { ownerUserId, isRevoked: false }      │
│       ├─ Update: { $set: { isRevoked: true } }          │
│       └─ Result: { modifiedCount: 5 }                   │
├─────────────────────────────────────────────────────────┤
│ 4. RETURN RESPONSE                                      │
│    └─ Return success with count                         │
│       Status: 200 OK                                    │
└─────────────────────────────────────────────────────────┘
```

### **Use Cases**
1. **Security Breach**: User suspects account compromise
2. **Password Change**: Force re-authentication everywhere
3. **Lost Device**: Revoke access from stolen/lost devices
4. **Admin Action**: Force user logout across all sessions

### **Error Responses**

#### **No Token** (401)
```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "No authentication token provided"
  }
}
```

#### **Invalid Token** (401)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid authentication token"
  }
}
```

#### **Server Error** (500)
```json
{
  "success": false,
  "error": {
    "code": "LOGOUT_ALL_FAILED",
    "message": "Failed to log out from all devices",
    "details": "Detailed error message"
  }
}
```

### **Security Features**
- ✅ **JWT Verification**: Validates token signature before revocation
- ✅ **Bulk Revocation**: Efficient updateMany() operation
- ✅ **Count Report**: Returns number of tokens revoked
- ✅ **Immediate Effect**: All tokens invalid immediately

### **Database Impact**
- **Queries**: 1 bulk update
- **Modified Documents**: All active tokens for user
- **Modified Fields**: `isRevoked`, `updatedAt`

### **Console Logging**
```
[Auth] User logged out from all devices: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## 5️⃣ **VERIFY TOKEN** - Token Validation

### **Function Signature**
```typescript
export const verifyToken = async (req: Request, res: Response): Promise<Response>
```

### **Endpoint**
```
GET /api/auth/verify
Authorization: Bearer <token>
```

### **Request Headers**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Success Response** (200 OK)
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "John Doe",
      "email": "john@example.com"
    },
    "tokenExpiresAt": "2025-10-20T10:30:00.000Z"
  }
}
```

### **Process Flow**

```
┌─────────────────────────────────────────────────────────┐
│ 1. EXTRACT TOKEN                                        │
│    ├─ Get Authorization header                          │
│    ├─ Check format: "Bearer <token>"                    │
│    ├─ Extract token part                                │
│    └─ If invalid → Return 401 NO_TOKEN                  │
├─────────────────────────────────────────────────────────┤
│ 2. VERIFY JWT SIGNATURE                                 │
│    └─ jwt.verify(token, JWT_SECRET)                     │
│       ├─ Check signature validity                       │
│       ├─ Check expiration (exp claim)                   │
│       ├─ Decode payload                                 │
│       ├─ If invalid → Return 401 INVALID_TOKEN          │
│       └─ If valid → Continue                             │
├─────────────────────────────────────────────────────────┤
│ 3. CHECK TOKEN IN DATABASE                              │
│    └─ Query JWTToken collection by token                │
│       ├─ If not found → Return 401 TOKEN_NOT_FOUND      │
│       └─ If found → Continue                             │
├─────────────────────────────────────────────────────────┤
│ 4. CHECK TOKEN STATUS                                   │
│    └─ Call jwtToken.isValid()                           │
│       ├─ Check isExpired()                              │
│       ├─ Check isRevoked                                │
│       ├─ If invalid → Return 401 TOKEN_INVALID          │
│       └─ If valid → Continue                             │
├─────────────────────────────────────────────────────────┤
│ 5. FETCH USER DATA                                      │
│    └─ Query User collection by userId                   │
│       ├─ If not found → Return 404 USER_NOT_FOUND       │
│       └─ If found → Continue                             │
├─────────────────────────────────────────────────────────┤
│ 6. RETURN RESPONSE                                      │
│    └─ Return user data and expiration                   │
│       Status: 200 OK                                    │
└─────────────────────────────────────────────────────────┘
```

### **Validation Layers**

```
Layer 1: JWT Signature ──────────┐
         ├─ Algorithm check       │
         ├─ Secret verification   │  Stateless
         └─ Expiration check      │  (No DB needed)
                                 ─┘
Layer 2: Database Check ─────────┐
         ├─ Token exists?         │
         ├─ Is revoked?           │  Stateful
         └─ Is expired?           │  (DB required)
                                 ─┘
Layer 3: User Check ─────────────┐
         ├─ User exists?          │
         └─ User active?          │  User validation
                                 ─┘
```

### **Error Responses**

#### **No Token** (401)
```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "No authentication token provided"
  }
}
```

#### **Invalid or Expired Token (JWT)** (401)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

#### **Token Not Found in Database** (401)
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_NOT_FOUND",
    "message": "Token not found in database"
  }
}
```

#### **Token Invalid (Revoked or Expired)** (401)
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_INVALID",
    "message": "Token has been revoked"
  }
}
```

or

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_INVALID",
    "message": "Token has expired"
  }
}
```

#### **User Not Found** (404)
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

#### **Server Error** (500)
```json
{
  "success": false,
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Failed to verify token",
    "details": "Detailed error message"
  }
}
```

### **Use Cases**
1. **API Gateway**: Validate token before routing requests
2. **Frontend**: Check if user is still authenticated
3. **Middleware**: Protect routes with authentication check
4. **Session Refresh**: Validate before issuing new token
5. **Admin Dashboard**: Verify admin privileges

### **Security Features**
- ✅ **Dual Verification**: JWT signature + database check
- ✅ **Revocation Support**: Detects revoked tokens
- ✅ **Expiration Check**: Both JWT exp and database timestamp
- ✅ **User Validation**: Ensures user still exists
- ✅ **Detailed Errors**: Specific error messages for debugging

### **Database Impact**
- **Queries**: 2 reads (JWTToken, User)
- **No Writes**: Read-only operation

### **Console Logging**
```
[Auth] Verify token error: <error details>
```

---

## 🔒 **Security Features**

### **Password Security**
```typescript
// Hashing
const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

// Verification
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Benefits:**
- ✅ Salt is generated automatically and stored in hash
- ✅ 10 rounds = 2^10 = 1024 iterations (resistant to brute force)
- ✅ bcrypt is slow by design (prevents rainbow table attacks)
- ✅ Future-proof: Can increase rounds as hardware improves

### **JWT Token Security**
```typescript
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
```

**Security Measures:**
- ✅ **Secret Key**: Required for signature verification
- ✅ **Expiration**: Tokens have limited lifetime
- ✅ **Algorithm**: HMAC SHA256 (symmetric)
- ✅ **Database Storage**: Enables revocation
- ✅ **Hybrid Approach**: Stateless signature + stateful storage

### **Input Validation**
```typescript
// Email normalization
email.toLowerCase().trim()

// Username sanitization
userName.trim()

// Email format validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Length validation
userName.length >= 3 && userName.length <= 50
password.length >= 8
```

### **Error Message Security**
- ✅ **No Email Enumeration**: Same error for non-existent user and wrong password
- ✅ **Generic Server Errors**: Details only in console logs
- ✅ **No Stack Traces**: Production mode should hide stack traces

---

## ⚠️ **Error Handling**

### **Error Response Structure**
```typescript
{
  success: false,
  error: {
    code: string,        // Machine-readable error code
    message: string,     // Human-readable error message
    details?: string     // Optional detailed information (dev mode)
  }
}
```

### **HTTP Status Codes Used**

| Code | Description | When Used |
|------|-------------|-----------|
| 200 | OK | Successful login, logout, verification |
| 201 | Created | Successful signup |
| 400 | Bad Request | Invalid input, weak password, already logged out |
| 401 | Unauthorized | Invalid credentials, invalid token, missing token |
| 404 | Not Found | Token not found, user not found |
| 409 | Conflict | Email already exists |
| 500 | Internal Server Error | Database errors, unexpected errors |

### **Error Codes**

| Code | Status | Description |
|------|--------|-------------|
| `MISSING_FIELDS` | 400 | Required fields missing in signup |
| `INVALID_EMAIL` | 400 | Email format is invalid |
| `INVALID_USERNAME` | 400 | Username length is invalid |
| `WEAK_PASSWORD` | 400 | Password too short |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `SIGNUP_FAILED` | 500 | Server error during signup |
| `MISSING_CREDENTIALS` | 400 | Email or password missing in login |
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `LOGIN_FAILED` | 500 | Server error during login |
| `NO_TOKEN` | 401 | Authorization header missing or invalid |
| `TOKEN_NOT_FOUND` | 404 | Token not found in database |
| `ALREADY_LOGGED_OUT` | 400 | Token already revoked |
| `LOGOUT_FAILED` | 500 | Server error during logout |
| `INVALID_TOKEN` | 401 | JWT signature invalid or expired |
| `LOGOUT_ALL_FAILED` | 500 | Server error during logout all |
| `TOKEN_INVALID` | 401 | Token revoked or expired in database |
| `USER_NOT_FOUND` | 404 | User not found in database |
| `VERIFICATION_FAILED` | 500 | Server error during verification |

### **Console Logging**
```typescript
// Success logs
console.log('[Auth] New user registered:', newUser.email);
console.log('[Auth] User logged in:', user.email);
console.log('[Auth] User logged out:', jwtToken.ownerUserId);
console.log('[Auth] User logged out from all devices:', decoded.userId);

// Error logs
console.error('[Auth] Signup error:', error);
console.error('[Auth] Login error:', error);
console.error('[Auth] Logout error:', error);
console.error('[Auth] Logout all error:', error);
console.error('[Auth] Verify token error:', error);
```

---

## 💾 **Database Operations**

### **Collections Used**
- **users**: User account information
- **jwttokens**: JWT token storage and management

### **Signup Operations**
```typescript
// 1. Check duplicate
await User.findOne({ email: email.toLowerCase() })

// 2. Create user
const newUser = new User({ userName, email, passwordHash })
await newUser.save()
```

### **Login Operations**
```typescript
// 1. Find user (include password)
await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')

// 2. Store token
const jwtToken = new JWTToken({ ownerUserId, token, expiresAt })
await jwtToken.save()
```

### **Logout Operations**
```typescript
// 1. Find token
await JWTToken.findOne({ token })

// 2. Revoke token
await jwtToken.revoke()
```

### **Logout All Operations**
```typescript
// Bulk update
await JWTToken.updateMany(
  { ownerUserId: decoded.userId, isRevoked: false },
  { $set: { isRevoked: true } }
)
```

### **Verify Operations**
```typescript
// 1. Find token
await JWTToken.findOne({ token })

// 2. Find user
await User.findOne({ userId: decoded.userId })
```

---

## 📖 **Usage Examples**

### **Example 1: Complete Registration Flow**

```typescript
// Client sends signup request
const response = await fetch('http://localhost:3001/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userName: 'Jane Smith',
    email: 'jane@example.com',
    password: 'securePass123'
  })
});

const data = await response.json();
// {
//   "success": true,
//   "message": "User registered successfully",
//   "data": {
//     "user": {
//       "userId": "abc123...",
//       "userName": "Jane Smith",
//       "email": "jane@example.com",
//       "createdAt": "2025-10-13T..."
//     }
//   }
// }
```

### **Example 2: Complete Login Flow**

```typescript
// Client sends login request
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'jane@example.com',
    password: 'securePass123'
  })
});

const data = await response.json();
const token = data.data.token;

// Store token securely
localStorage.setItem('authToken', token);
// or
sessionStorage.setItem('authToken', token);
```

### **Example 3: Using Token in Protected Requests**

```typescript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3001/api/protected-endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### **Example 4: Token Verification Before Request**

```typescript
const token = localStorage.getItem('authToken');

// Verify token is still valid
const verifyResponse = await fetch('http://localhost:3001/api/auth/verify', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
});

if (verifyResponse.ok) {
  // Token is valid, proceed with request
  const data = await verifyResponse.json();
  console.log('Logged in as:', data.data.user.userName);
} else {
  // Token invalid, redirect to login
  window.location.href = '/login';
}
```

### **Example 5: Logout Flow**

```typescript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3001/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

if (response.ok) {
  // Clear stored token
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

### **Example 6: Logout from All Devices**

```typescript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3001/api/auth/logout-all', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log(`Logged out from ${data.data.tokensRevoked} devices`);

// Clear stored token
localStorage.removeItem('authToken');
window.location.href = '/login';
```

---

## 🎯 **Best Practices**

### **1. Environment Variables**
```env
# Development
JWT_SECRET=dev-secret-key-min-32-characters-long
JWT_EXPIRATION=7d

# Production
JWT_SECRET=<use-aws-secrets-manager-or-vault>
JWT_EXPIRATION=1h  # Shorter expiration in production
```

### **2. Error Handling**
```typescript
try {
  // Controller logic
} catch (error) {
  console.error('[Auth] Error:', error);
  return res.status(500).json({
    success: false,
    error: {
      code: 'ERROR_CODE',
      message: 'User-friendly message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  });
}
```

### **3. Password Requirements**
```typescript
// Current: Minimum 8 characters
// Recommended for production:
// - Min 12 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
```

### **4. Token Storage**
```typescript
// ✅ Good: httpOnly cookie (most secure)
res.cookie('token', tokenString, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

// ⚠️ Acceptable: localStorage (XSS vulnerable)
localStorage.setItem('token', tokenString);

// ❌ Bad: Regular cookie (XSS and CSRF vulnerable)
document.cookie = `token=${tokenString}`;
```

### **5. Rate Limiting**
```typescript
// Recommended: Add rate limiting middleware
// - 5 login attempts per 15 minutes
// - 3 signup attempts per hour
// - 100 verify requests per hour
```

---

## 🔄 **Related Documentation**

- **[User Model Documentation](./user-model-documentation.md)** - User schema and methods
- **[JWTToken Model Documentation](./jwttoken-model-documentation.md)** - Token schema and methods
- **[Authentication Routes Documentation](./auth-routes-documentation.md)** - Route definitions
- **[Authentication Testing Guide](./authentication-testing-guide.md)** - Testing instructions

---

## 📚 **Dependencies**

```json
{
  "express": "^4.18.2",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.0.0"
}
```

---

## 🎓 **Learning Resources**

### **bcrypt**
- [bcrypt npm package](https://www.npmjs.com/package/bcrypt)
- [How bcrypt works](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)

### **JWT**
- [JWT.io](https://jwt.io/)
- [jsonwebtoken npm package](https://www.npmjs.com/package/jsonwebtoken)
- [JWT Best Practices](https://curity.io/resources/learn/jwt-best-practices/)

### **Express**
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)

---

*Last Updated: October 13, 2025*
*Version: 1.0.0*
