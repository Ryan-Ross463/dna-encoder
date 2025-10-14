# Authentication Routes Documentation

## 📄 **File**: `src/routes/auth.routes.ts`

### **Purpose**
The Authentication Routes module defines all HTTP endpoints for user authentication operations. It acts as the routing layer that maps URL paths to their corresponding controller functions, handling signup, login, logout, and token verification requests.

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Route Definitions](#route-definitions)
4. [Request/Response Examples](#requestresponse-examples)
5. [Integration](#integration)
6. [Security Considerations](#security-considerations)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 **Overview**

### **What is a Route?**
A route is a URL endpoint that maps to a specific controller function. It defines:
- **HTTP Method** (GET, POST, PUT, DELETE)
- **URL Path** (e.g., `/api/auth/signup`)
- **Handler Function** (e.g., `signup` controller)

### **Router Pattern**
```
Client Request → Express Router → Controller → Model → Database
                       ↓
                  Route Match
                       ↓
              Controller Function
```

### **Module Structure**
```typescript
import { Router } from 'express';
import { controllers } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', signup);        // Register
router.post('/login', login);          // Authenticate
router.post('/logout', logout);        // Single device logout
router.post('/logout-all', logoutAll); // All devices logout
router.get('/verify', verifyToken);    // Token validation

export default router;
```

---

## 🏗️ **Architecture**

### **Express Router**
Express Router is a mini-application capable of handling middleware and routes independently.

```typescript
import { Router } from 'express';
const router = Router();
```

**Benefits:**
- ✅ Modular route organization
- ✅ Middleware isolation per route group
- ✅ Easy to test and maintain
- ✅ Can be mounted at different paths

### **Route Mounting**
```typescript
// In index.ts (main server file)
import authRoutes from './routes/auth.routes';

app.use('/api/auth', authRoutes);
```

**Result:**
```
/api/auth/signup      → POST /api/auth/signup
/api/auth/login       → POST /api/auth/login
/api/auth/logout      → POST /api/auth/logout
/api/auth/logout-all  → POST /api/auth/logout-all
/api/auth/verify      → GET  /api/auth/verify
```

### **Request Flow**
```
┌──────────────────────────────────────────────────────────┐
│ 1. CLIENT SENDS REQUEST                                  │
│    POST http://localhost:3001/api/auth/signup            │
│    Body: { userName, email, password }                   │
├──────────────────────────────────────────────────────────┤
│ 2. EXPRESS RECEIVES REQUEST                              │
│    ├─ Parse request body (JSON)                          │
│    ├─ Match route: /api/auth/signup                      │
│    └─ HTTP method: POST                                  │
├──────────────────────────────────────────────────────────┤
│ 3. ROUTER MATCHES PATH                                   │
│    └─ authRoutes: router.post('/signup', signup)         │
├──────────────────────────────────────────────────────────┤
│ 4. CONTROLLER EXECUTES                                   │
│    └─ signup(req, res)                                   │
│       ├─ Validate input                                  │
│       ├─ Hash password                                   │
│       ├─ Save to database                                │
│       └─ Return response                                 │
├──────────────────────────────────────────────────────────┤
│ 5. EXPRESS SENDS RESPONSE                                │
│    Status: 201 Created                                   │
│    Body: { success: true, data: { user } }               │
└──────────────────────────────────────────────────────────┘
```

---

## 🛣️ **Route Definitions**

---

## 1️⃣ **POST /api/auth/signup** - User Registration

### **Definition**
```typescript
router.post('/signup', signup);
```

### **Full URL**
```
POST http://localhost:3001/api/auth/signup
```

### **Purpose**
Register a new user account with username, email, and password.

### **HTTP Method**
`POST` - Creates a new resource (user account)

### **Authentication Required**
❌ No - Public endpoint

### **Request Headers**
```http
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

### **Request Body Schema**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `userName` | string | ✅ Yes | 3-50 characters | User's display name |
| `email` | string | ✅ Yes | Valid email format, unique | User's email address |
| `password` | string | ✅ Yes | Min 8 characters | User's password (will be hashed) |

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

### **Error Responses**
- **400 Bad Request**: Missing fields, invalid format, weak password
- **409 Conflict**: Email already exists
- **500 Internal Server Error**: Database error

### **cURL Example**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### **PowerShell Example**
```powershell
$body = @{
    userName = "John Doe"
    email = "john@example.com"
    password = "securePassword123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signup" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### **JavaScript Fetch Example**
```javascript
const response = await fetch('http://localhost:3001/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userName: 'John Doe',
    email: 'john@example.com',
    password: 'securePassword123'
  })
});

const data = await response.json();
console.log(data);
```

---

## 2️⃣ **POST /api/auth/login** - User Authentication

### **Definition**
```typescript
router.post('/login', login);
```

### **Full URL**
```
POST http://localhost:3001/api/auth/login
```

### **Purpose**
Authenticate user credentials and receive a JWT token for subsequent requests.

### **HTTP Method**
`POST` - Authenticate and create session token

### **Authentication Required**
❌ No - Public endpoint

### **Request Headers**
```http
Content-Type: application/json
```

### **Request Body**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### **Request Body Schema**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ Yes | User's registered email |
| `password` | string | ✅ Yes | User's password |

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

### **Response Data Schema**

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | JWT token for authentication |
| `expiresIn` | string | Human-readable expiration (e.g., "7d") |
| `expiresAt` | string (ISO 8601) | Exact expiration timestamp |
| `user` | object | User information |

### **Error Responses**
- **400 Bad Request**: Missing email or password
- **401 Unauthorized**: Invalid credentials
- **500 Internal Server Error**: Database error

### **cURL Example**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### **PowerShell Example**
```powershell
$body = @{
    email = "john@example.com"
    password = "securePassword123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"

$data = $response.Content | ConvertFrom-Json
$token = $data.data.token

# Save token for subsequent requests
$env:AUTH_TOKEN = $token
```

### **JavaScript Fetch Example**
```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securePassword123'
  })
});

const data = await response.json();
const token = data.data.token;

// Store token securely
localStorage.setItem('authToken', token);
```

---

## 3️⃣ **POST /api/auth/logout** - Single Device Logout

### **Definition**
```typescript
router.post('/logout', logout);
```

### **Full URL**
```
POST http://localhost:3001/api/auth/logout
```

### **Purpose**
Revoke the current JWT token, logging out from the current device only.

### **HTTP Method**
`POST` - Modify token status (revoke)

### **Authentication Required**
✅ Yes - Requires valid JWT token

### **Request Headers**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Request Body**
None (empty body)

### **Success Response** (200 OK)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### **Error Responses**
- **401 Unauthorized**: No token or invalid token
- **404 Not Found**: Token not found in database
- **400 Bad Request**: Already logged out
- **500 Internal Server Error**: Database error

### **cURL Example**
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **PowerShell Example**
```powershell
$token = $env:AUTH_TOKEN

Invoke-WebRequest -Uri "http://localhost:3001/api/auth/logout" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### **JavaScript Fetch Example**
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3001/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  // Clear stored token
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

---

## 4️⃣ **POST /api/auth/logout-all** - Multi-Device Logout

### **Definition**
```typescript
router.post('/logout-all', logoutAll);
```

### **Full URL**
```
POST http://localhost:3001/api/auth/logout-all
```

### **Purpose**
Revoke all JWT tokens for the user, logging out from all devices simultaneously.

### **HTTP Method**
`POST` - Modify multiple token statuses (bulk revoke)

### **Authentication Required**
✅ Yes - Requires valid JWT token

### **Request Headers**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Request Body**
None (empty body)

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

### **Response Data Schema**

| Field | Type | Description |
|-------|------|-------------|
| `tokensRevoked` | number | Number of tokens that were revoked |

### **Error Responses**
- **401 Unauthorized**: No token or invalid token
- **500 Internal Server Error**: Database error

### **Use Cases**
- User suspects account compromise
- Password change (force re-authentication)
- Lost or stolen device
- Security audit cleanup

### **cURL Example**
```bash
curl -X POST http://localhost:3001/api/auth/logout-all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **PowerShell Example**
```powershell
$token = $env:AUTH_TOKEN

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/logout-all" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" }

$data = $response.Content | ConvertFrom-Json
Write-Host "Revoked $($data.data.tokensRevoked) tokens"
```

### **JavaScript Fetch Example**
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3001/api/auth/logout-all', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(`Logged out from ${data.data.tokensRevoked} devices`);

// Clear stored token
localStorage.removeItem('authToken');
window.location.href = '/login';
```

---

## 5️⃣ **GET /api/auth/verify** - Token Verification

### **Definition**
```typescript
router.get('/verify', verifyToken);
```

### **Full URL**
```
GET http://localhost:3001/api/auth/verify
```

### **Purpose**
Verify if a JWT token is still valid (not expired or revoked).

### **HTTP Method**
`GET` - Read token status (no state change)

### **Authentication Required**
✅ Yes - Requires JWT token to verify

### **Request Headers**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Request Body**
None

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

### **Response Data Schema**

| Field | Type | Description |
|-------|------|-------------|
| `user` | object | Current user information |
| `tokenExpiresAt` | string (ISO 8601) | When the token expires |

### **Error Responses**
- **401 Unauthorized**: No token, invalid signature, expired token, or revoked token
- **404 Not Found**: Token not in database or user not found
- **500 Internal Server Error**: Database error

### **Use Cases**
- Frontend: Check if user is still authenticated
- API Gateway: Validate before routing request
- Middleware: Protect routes
- Session Management: Refresh token logic

### **cURL Example**
```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **PowerShell Example**
```powershell
$token = $env:AUTH_TOKEN

Invoke-WebRequest -Uri "http://localhost:3001/api/auth/verify" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### **JavaScript Fetch Example**
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3001/api/auth/verify', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const data = await response.json();
  console.log('Authenticated as:', data.data.user.userName);
  console.log('Token expires:', data.data.tokenExpiresAt);
} else {
  // Token invalid, redirect to login
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

---

## 📊 **Route Summary Table**

| Route | Method | Auth Required | Purpose | Request Body | Response Status |
|-------|--------|---------------|---------|--------------|-----------------|
| `/api/auth/signup` | POST | ❌ No | Register new user | userName, email, password | 201 Created |
| `/api/auth/login` | POST | ❌ No | Authenticate user | email, password | 200 OK |
| `/api/auth/logout` | POST | ✅ Yes | Logout (current device) | None | 200 OK |
| `/api/auth/logout-all` | POST | ✅ Yes | Logout (all devices) | None | 200 OK |
| `/api/auth/verify` | GET | ✅ Yes | Verify token | None | 200 OK |

---

## 📡 **Request/Response Examples**

### **Complete Workflow Example**

#### **1. Signup**
```http
POST /api/auth/signup HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "userName": "Alice Johnson",
  "email": "alice@example.com",
  "password": "mySecurePass789"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "xyz789...",
      "userName": "Alice Johnson",
      "email": "alice@example.com",
      "createdAt": "2025-10-13T11:00:00.000Z"
    }
  }
}
```

#### **2. Login**
```http
POST /api/auth/login HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "mySecurePass789"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGci...",
    "expiresIn": "7d",
    "expiresAt": "2025-10-20T11:00:00.000Z",
    "user": {
      "userId": "xyz789...",
      "userName": "Alice Johnson",
      "email": "alice@example.com"
    }
  }
}
```

#### **3. Verify Token**
```http
GET /api/auth/verify HTTP/1.1
Host: localhost:3001
Authorization: Bearer eyJhbGci...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "userId": "xyz789...",
      "userName": "Alice Johnson",
      "email": "alice@example.com"
    },
    "tokenExpiresAt": "2025-10-20T11:00:00.000Z"
  }
}
```

#### **4. Logout**
```http
POST /api/auth/logout HTTP/1.1
Host: localhost:3001
Authorization: Bearer eyJhbGci...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🔗 **Integration**

### **How Routes are Mounted**

**File: `src/index.ts`**
```typescript
import express from 'express';
import authRoutes from './routes/auth.routes';

const app = express();

// Middleware
app.use(express.json());

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Start server
app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

### **Route Hierarchy**
```
Express App (index.ts)
│
├── Middleware
│   ├── express.json()         ← Parse JSON body
│   └── express.urlencoded()   ← Parse URL-encoded body
│
└── Routes
    ├── /health                ← Health check endpoint
    ├── /api                   ← API info endpoint
    └── /api/auth              ← Authentication routes (mounted here)
        ├── POST /signup
        ├── POST /login
        ├── POST /logout
        ├── POST /logout-all
        └── GET  /verify
```

### **Adding New Routes**

To add a new authentication route:

```typescript
// 1. Import new controller function
import { newController } from '../controllers/auth.controller';

// 2. Define route
router.post('/new-endpoint', newController);

// Result: POST /api/auth/new-endpoint
```

---

## 🔒 **Security Considerations**

### **1. HTTPS in Production**
```typescript
// ❌ Development
http://localhost:3001/api/auth/login

// ✅ Production
https://api.yourdomain.com/api/auth/login
```

### **2. CORS Configuration**
```typescript
import cors from 'cors';

app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true,
  methods: ['GET', 'POST']
}));
```

### **3. Rate Limiting**
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts'
});

router.post('/login', authLimiter, login);
router.post('/signup', authLimiter, signup);
```

### **4. Request Size Limits**
```typescript
app.use(express.json({ limit: '10kb' }));
```

### **5. Helmet Security Headers**
```typescript
import helmet from 'helmet';

app.use(helmet());
```

---

## 🧪 **Testing**

### **Manual Testing with PowerShell**

```powershell
# Complete test script
Write-Host "=== Testing Authentication Routes ===" -ForegroundColor Cyan

# 1. Signup
$signupBody = @{
    userName = "Test User"
    email = "test@example.com"
    password = "testPass123"
} | ConvertTo-Json

Write-Host "`n1. Testing Signup..." -ForegroundColor Yellow
$signupResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signup" `
    -Method POST -Body $signupBody -ContentType "application/json" -UseBasicParsing
Write-Host "Status:" $signupResponse.StatusCode

# 2. Login
$loginBody = @{
    email = "test@example.com"
    password = "testPass123"
} | ConvertTo-Json

Write-Host "`n2. Testing Login..." -ForegroundColor Yellow
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
    -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$token = ($loginResponse.Content | ConvertFrom-Json).data.token
Write-Host "Status:" $loginResponse.StatusCode
Write-Host "Token:" $token.Substring(0, 50) "..."

# 3. Verify
Write-Host "`n3. Testing Verify..." -ForegroundColor Yellow
$verifyResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/verify" `
    -Method GET -Headers @{ "Authorization" = "Bearer $token" } -UseBasicParsing
Write-Host "Status:" $verifyResponse.StatusCode

# 4. Logout
Write-Host "`n4. Testing Logout..." -ForegroundColor Yellow
$logoutResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/logout" `
    -Method POST -Headers @{ "Authorization" = "Bearer $token" } -UseBasicParsing
Write-Host "Status:" $logoutResponse.StatusCode

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Green
```

### **Automated Testing with Jest**

```typescript
import request from 'supertest';
import app from '../src/index';

describe('Authentication Routes', () => {
  let token: string;

  test('POST /api/auth/signup - should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        userName: 'Test User',
        email: 'test@example.com',
        password: 'testPass123'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
  });

  test('POST /api/auth/login - should authenticate user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testPass123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();

    token = response.body.data.token;
  });

  test('GET /api/auth/verify - should verify valid token', async () => {
    const response = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
  });

  test('POST /api/auth/logout - should logout user', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

---

## 🔧 **Troubleshooting**

### **Problem 1: 404 Not Found**

**Symptom:**
```json
{
  "error": "Cannot POST /api/auth/signup"
}
```

**Causes:**
- Routes not mounted correctly in `index.ts`
- Typo in URL path
- Server not started

**Solution:**
```typescript
// Check index.ts
app.use('/api/auth', authRoutes);  // Correct mounting

// Verify server is running
console.log('Server running on http://localhost:3001');
```

---

### **Problem 2: 401 Unauthorized**

**Symptom:**
```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "No authentication token provided"
  }
}
```

**Causes:**
- Missing Authorization header
- Incorrect header format
- Token not prefixed with "Bearer "

**Solution:**
```typescript
// ❌ Wrong
headers: { "Authorization": "token_string" }

// ✅ Correct
headers: { "Authorization": "Bearer token_string" }
```

---

### **Problem 3: 500 Internal Server Error**

**Symptom:**
```json
{
  "success": false,
  "error": {
    "code": "SIGNUP_FAILED",
    "message": "Failed to register user"
  }
}
```

**Causes:**
- Database connection error
- Missing environment variables
- Controller exception

**Solution:**
```bash
# Check database connection
[MongoDB] Connected successfully

# Check environment variables
JWT_SECRET=...
JWT_EXPIRATION=7d

# Check server logs
console.error('[Auth] Signup error:', error);
```

---

### **Problem 4: CORS Error (Frontend)**

**Symptom:**
```
Access to fetch at 'http://localhost:3001/api/auth/login' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```typescript
// Install cors
npm install cors
npm install --save-dev @types/cors

// Add to index.ts
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## 📚 **Related Documentation**

- **[Auth Controller Documentation](./auth-controller-documentation.md)** - Controller implementation details
- **[Authentication Testing Guide](./authentication-testing-guide.md)** - Comprehensive testing guide
- **[User Model Documentation](./user-model-documentation.md)** - User schema and validation
- **[JWTToken Model Documentation](./jwttoken-model-documentation.md)** - Token management

---

## 🎯 **Best Practices**

### **1. RESTful Conventions**
```
POST   /api/auth/signup       ← Create (register)
POST   /api/auth/login        ← Create (session)
POST   /api/auth/logout       ← Delete (session)
GET    /api/auth/verify       ← Read (status)
```

### **2. Consistent Response Format**
```typescript
// Success
{
  success: true,
  message: string,
  data?: object
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: string
  }
}
```

### **3. HTTP Status Codes**
- **200 OK**: Successful operation
- **201 Created**: Resource created (signup)
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Authentication failed
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource (email exists)
- **500 Internal Server Error**: Server error

### **4. Route Organization**
```
/api/auth     ← Authentication routes
/api/users    ← User management routes
/api/data     ← Data-related routes
```

---

## 📦 **Dependencies**

```json
{
  "express": "^4.18.2",
  "@types/express": "^4.17.17"
}
```

---

*Last Updated: October 13, 2025*
*Version: 1.0.0*
