# Middleware Documentation

## 📁 **Files**
- `src/middleware/auth.middleware.ts` - Authentication middleware
- `src/middleware/validation.middleware.ts` - Input validation middleware
- `src/middleware/error.middleware.ts` - Error handling middleware
- `src/middleware/index.ts` - Central export point

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Authentication Middleware](#authentication-middleware)
3. [Validation Middleware](#validation-middleware)
4. [Error Handling Middleware](#error-handling-middleware)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)

---

## 🎯 **Overview**

### **What is Middleware?**
Middleware functions are functions that have access to the request object (`req`), response object (`res`), and the next middleware function (`next`) in the application's request-response cycle.

```
Client Request → Middleware 1 → Middleware 2 → Controller → Response
                    ↓              ↓              ↓
               Authenticate   Validate Input  Process Logic
```

### **Middleware Flow**
```typescript
app.use(express.json());                    // Parse JSON
app.use('/api/auth', authRoutes);          // Route matching
router.post('/protected', authenticate, controller);
                           ↓
                    Middleware runs first
                           ↓
                    If success: next()
                           ↓
                    Controller executes
```

---

## 🔐 **Authentication Middleware**

### **File**: `src/middleware/auth.middleware.ts`

---

### **1. authenticate** - Required Authentication

**Purpose**: Protects routes by verifying JWT tokens and attaching user data to request.

**Signature**:
```typescript
authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void>
```

**Process Flow**:
```
1. Extract token from Authorization header
   ↓
2. Verify JWT signature with JWT_SECRET
   ↓
3. Check token exists in database
   ↓
4. Verify token is not revoked or expired
   ↓
5. Fetch user data from database
   ↓
6. Attach user data to req.user
   ↓
7. Call next() to continue to controller
```

**Usage**:
```typescript
import { authenticate } from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Protect a single route
router.get('/profile', authenticate, getProfile);

// In controller, access authenticated user
const getProfile = (req: AuthenticatedRequest, res: Response) => {
  const user = req.user; // { userId, email, userName }
  console.log('Authenticated user:', user.email);
  
  res.json({
    success: true,
    data: { user }
  });
};
```

**Request Requirements**:
```http
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success**: Continues to next middleware/controller
- `req.user` populated with user data
- `req.token` contains the JWT token

**Error Responses**:

| Status | Code | Message | When |
|--------|------|---------|------|
| 401 | `NO_TOKEN` | No authentication token provided | No Authorization header |
| 401 | `INVALID_TOKEN` | Invalid or expired token | JWT signature invalid |
| 401 | `TOKEN_NOT_FOUND` | Token not found in database | Token not in DB |
| 401 | `TOKEN_INVALID` | Token has been revoked | Token revoked or expired |
| 404 | `USER_NOT_FOUND` | User not found | User deleted |
| 500 | `AUTH_MIDDLEWARE_ERROR` | Failed to authenticate | Server error |

**Example Error**:
```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "No authentication token provided",
    "hint": "Include Authorization header: Bearer <token>"
  }
}
```

---

### **2. optionalAuthenticate** - Optional Authentication

**Purpose**: Attempts to authenticate but doesn't fail if no token provided. Useful for routes that can work with or without authentication.

**Signature**:
```typescript
optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void>
```

**Process Flow**:
```
1. Check if Authorization header exists
   ├─ If NO → Call next() (continue without auth)
   └─ If YES → Continue
       ↓
2. Try to verify token
   ├─ If VALID → Attach user data to req.user
   └─ If INVALID → Continue anyway (no error)
       ↓
3. Call next()
```

**Usage**:
```typescript
import { optionalAuthenticate } from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Optional authentication
router.get('/public-content', optionalAuthenticate, getContent);

// In controller
const getContent = (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    // User is authenticated - show personalized content
    console.log('Authenticated user:', req.user.email);
    return res.json({
      success: true,
      data: {
        content: 'Personalized content',
        userName: req.user.userName
      }
    });
  } else {
    // User is not authenticated - show public content
    console.log('Anonymous user');
    return res.json({
      success: true,
      data: {
        content: 'Public content'
      }
    });
  }
};
```

**Use Cases**:
- Public endpoints that show extra data if authenticated
- Content that adjusts based on authentication status
- Analytics endpoints that track both authenticated and anonymous users

**Success**: Always continues (never throws error)
- `req.user` populated if token valid
- `req.user` undefined if no token or invalid token

---

### **3. requireOwnership** - Ownership Verification

**Purpose**: Ensures authenticated user owns the resource they're accessing. Must be used AFTER authenticate middleware.

**Signature**:
```typescript
requireOwnership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void
```

**Process Flow**:
```
1. Check req.user exists (authenticate must run first)
   ↓
2. Extract userId from URL params (req.params.userId)
   ↓
3. Compare req.user.userId with req.params.userId
   ├─ If MATCH → Call next() (user owns resource)
   └─ If NO MATCH → Return 403 Forbidden
```

**Usage**:
```typescript
import { authenticate, requireOwnership } from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Protect route and verify ownership
router.get('/users/:userId', authenticate, requireOwnership, getUserProfile);
router.put('/users/:userId', authenticate, requireOwnership, updateUserProfile);
router.delete('/users/:userId', authenticate, requireOwnership, deleteUser);

// In controller
const getUserProfile = (req: AuthenticatedRequest, res: Response) => {
  // If we reach here, user is authenticated AND owns the resource
  const userId = req.params.userId;
  
  // Fetch user data...
  res.json({
    success: true,
    data: { userId }
  });
};
```

**URL Pattern**:
```
/api/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890
            ↑
            This userId must match req.user.userId
```

**Error Responses**:

| Status | Code | Message | When |
|--------|------|---------|------|
| 401 | `NOT_AUTHENTICATED` | User not authenticated | authenticate middleware not used |
| 403 | `FORBIDDEN` | You do not have permission | userId mismatch |
| 500 | `OWNERSHIP_CHECK_ERROR` | Failed to verify ownership | Server error |

**Example Error**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource",
    "hint": "You can only access your own data"
  }
}
```

**Scenarios**:

```typescript
// ✅ ALLOWED
// User: a1b2c3d4-... requests /users/a1b2c3d4-...
req.user.userId === req.params.userId // Match!

// ❌ FORBIDDEN
// User: a1b2c3d4-... requests /users/xyz789-...
req.user.userId !== req.params.userId // No match!
```

---

### **AuthenticatedRequest Interface**

**Extended Request type with user data**:

```typescript
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    userName: string;
  };
  token?: string;
}
```

**Usage in Controllers**:
```typescript
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const controller = (req: AuthenticatedRequest, res: Response) => {
  // Access authenticated user data
  const userId = req.user?.userId;
  const email = req.user?.email;
  const userName = req.user?.userName;
  const token = req.token;
};
```

---

## ✅ **Validation Middleware**

### **File**: `src/middleware/validation.middleware.ts`

---

### **1. validateSignupData** - Signup Validation

**Purpose**: Validates signup request data before reaching controller.

**Checks**:
- ✅ Required fields: userName, email, password
- ✅ Email format (regex)
- ✅ Username length (3-50 characters)
- ✅ Password strength (min 8 characters)

**Usage**:
```typescript
import { validateSignupData } from '../middleware';

router.post('/signup', validateSignupData, signup);
```

**Valid Request**:
```json
{
  "userName": "John Doe",
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Error Examples**:

**Missing Fields**:
```json
{
  "success": false,
  "error": {
    "code": "MISSING_FIELDS",
    "message": "Username, email, and password are required",
    "fields": {
      "userName": "Required",
      "email": "Required"
    }
  }
}
```

**Invalid Email**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Please provide a valid email address"
  }
}
```

**Invalid Username**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_USERNAME",
    "message": "Username must be between 3 and 50 characters"
  }
}
```

**Weak Password**:
```json
{
  "success": false,
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password must be at least 8 characters long"
  }
}
```

---

### **2. validateLoginData** - Login Validation

**Purpose**: Validates login request data.

**Checks**:
- ✅ Required fields: email, password

**Usage**:
```typescript
import { validateLoginData } from '../middleware';

router.post('/login', validateLoginData, login);
```

**Valid Request**:
```json
{
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Error Example**:
```json
{
  "success": false,
  "error": {
    "code": "MISSING_CREDENTIALS",
    "message": "Email and password are required",
    "fields": {
      "email": "Required",
      "password": "Required"
    }
  }
}
```

---

### **3. validateUserIdParam** - User ID Validation

**Purpose**: Validates userId URL parameter.

**Checks**:
- ✅ userId parameter exists
- ✅ UUID v4 format

**Usage**:
```typescript
import { validateUserIdParam } from '../middleware';

router.get('/users/:userId', validateUserIdParam, authenticate, getUser);
```

**Valid URL**:
```
/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Error Examples**:

**Missing User ID**:
```json
{
  "success": false,
  "error": {
    "code": "MISSING_USER_ID",
    "message": "User ID is required in the URL"
  }
}
```

**Invalid Format**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_USER_ID",
    "message": "User ID must be a valid UUID"
  }
}
```

---

### **4. validateUpdateData** - Update Validation

**Purpose**: Validates user update request data.

**Checks**:
- ✅ At least one field provided (userName or email)
- ✅ Email format if provided
- ✅ Username length if provided

**Usage**:
```typescript
import { validateUpdateData } from '../middleware';

router.put('/users/:userId', authenticate, validateUpdateData, updateUser);
```

**Valid Requests**:
```json
// Update userName only
{
  "userName": "New Name"
}

// Update email only
{
  "email": "newemail@example.com"
}

// Update both
{
  "userName": "New Name",
  "email": "newemail@example.com"
}
```

**Error Examples**:

**No Update Data**:
```json
{
  "success": false,
  "error": {
    "code": "NO_UPDATE_DATA",
    "message": "At least one field (userName or email) must be provided"
  }
}
```

**Invalid Email**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Please provide a valid email address"
  }
}
```

---

### **5. validateEmail** - Email Validation Helper

**Purpose**: Helper function to validate email format.

**Usage**:
```typescript
import { validateEmail } from '../middleware';

const isValid = validateEmail('test@example.com'); // true
const isInvalid = validateEmail('invalid-email'); // false
```

**Regex Pattern**:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

---

## ⚠️ **Error Handling Middleware**

### **File**: `src/middleware/error.middleware.ts`

---

### **1. errorHandler** - Global Error Handler

**Purpose**: Catches all errors and sends appropriate responses. Must be defined AFTER all routes.

**Signature**:
```typescript
errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void
```

**Usage in index.ts**:
```typescript
import { errorHandler } from './middleware';

// Define all routes first
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handler must be LAST
app.use(errorHandler);
```

**Error Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": "Stack trace (development only)",
    "path": "/api/endpoint",
    "timestamp": "2025-10-13T10:30:00.000Z"
  }
}
```

**Features**:
- ✅ Catches all unhandled errors
- ✅ Logs errors to console
- ✅ Hides stack traces in production
- ✅ Includes request path and timestamp
- ✅ Sends appropriate HTTP status codes

---

### **2. AppError** - Custom Error Class

**Purpose**: Create custom errors with status codes.

**Usage**:
```typescript
import { AppError } from '../middleware';

// Throw custom error in controller
throw new AppError('User not found', 404, 'USER_NOT_FOUND');

// Error is caught by errorHandler
```

**Constructor**:
```typescript
new AppError(
  message: string,     // Human-readable message
  statusCode: number,  // HTTP status code
  code: string         // Machine-readable error code
)
```

**Properties**:
```typescript
err.message        // "User not found"
err.statusCode     // 404
err.code           // "USER_NOT_FOUND"
err.isOperational  // true
```

---

### **3. asyncHandler** - Async Error Wrapper

**Purpose**: Wraps async route handlers to catch errors automatically.

**Usage**:
```typescript
import { asyncHandler } from '../middleware';

// Without asyncHandler (manual try-catch)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// With asyncHandler (automatic error handling)
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json({ success: true, data: users });
}));
// Errors are automatically caught and passed to errorHandler
```

**Benefits**:
- ✅ Eliminates repetitive try-catch blocks
- ✅ Automatic error forwarding to errorHandler
- ✅ Cleaner controller code

---

### **4. notFoundHandler** - 404 Handler

**Purpose**: Handles 404 errors for undefined routes. Must be defined BEFORE errorHandler.

**Usage in index.ts**:
```typescript
import { notFoundHandler, errorHandler } from './middleware';

// Define all routes first
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler LAST
app.use(errorHandler);
```

**Response**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Endpoint not found",
    "path": "/api/invalid-endpoint",
    "method": "GET",
    "hint": "Check the API documentation for available endpoints"
  }
}
```

---

## 📖 **Usage Examples**

### **Example 1: Protected Route**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Protected route - requires authentication
router.get('/profile', authenticate, getProfile);

const getProfile = (req: AuthenticatedRequest, res: Response) => {
  // User is authenticated, req.user is populated
  res.json({
    success: true,
    data: {
      user: req.user // { userId, email, userName }
    }
  });
};

export default router;
```

---

### **Example 2: Protected Route with Ownership Check**

```typescript
import { Router } from 'express';
import { authenticate, requireOwnership, validateUserIdParam } from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// User can only access their own profile
router.get(
  '/users/:userId',
  validateUserIdParam,  // Validate userId format
  authenticate,         // Verify authentication
  requireOwnership,     // Verify ownership
  getUserProfile
);

const getUserProfile = (req: AuthenticatedRequest, res: Response) => {
  // User is authenticated AND owns this resource
  const userId = req.params.userId;
  
  res.json({
    success: true,
    data: { userId }
  });
};

export default router;
```

---

### **Example 3: Signup with Validation**

```typescript
import { Router } from 'express';
import { validateSignupData } from '../middleware';

const router = Router();

// Validate data before signup
router.post('/signup', validateSignupData, signup);

const signup = (req: Request, res: Response) => {
  // Data is already validated
  const { userName, email, password } = req.body;
  
  // Process signup...
  res.status(201).json({
    success: true,
    message: 'User registered successfully'
  });
};

export default router;
```

---

### **Example 4: Optional Authentication**

```typescript
import { Router } from 'express';
import { optionalAuthenticate } from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Works with or without authentication
router.get('/content', optionalAuthenticate, getContent);

const getContent = (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    // Authenticated user - personalized content
    return res.json({
      success: true,
      data: {
        message: `Welcome back, ${req.user.userName}!`,
        personalizedContent: true
      }
    });
  } else {
    // Anonymous user - public content
    return res.json({
      success: true,
      data: {
        message: 'Welcome, guest!',
        personalizedContent: false
      }
    });
  }
};

export default router;
```

---

### **Example 5: Complete Route Setup**

```typescript
import { Router } from 'express';
import {
  authenticate,
  requireOwnership,
  validateUserIdParam,
  validateUpdateData
} from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /users/:userId - Get user profile
router.get(
  '/users/:userId',
  validateUserIdParam,
  authenticate,
  requireOwnership,
  getUserProfile
);

// PUT /users/:userId - Update user profile
router.put(
  '/users/:userId',
  validateUserIdParam,
  authenticate,
  requireOwnership,
  validateUpdateData,
  updateUserProfile
);

// DELETE /users/:userId - Delete user account
router.delete(
  '/users/:userId',
  validateUserIdParam,
  authenticate,
  requireOwnership,
  deleteUser
);

// Controllers
const getUserProfile = (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: { user: req.user } });
};

const updateUserProfile = (req: AuthenticatedRequest, res: Response) => {
  const { userName, email } = req.body;
  res.json({ success: true, message: 'Profile updated' });
};

const deleteUser = (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, message: 'Account deleted' });
};

export default router;
```

---

## 🎯 **Best Practices**

### **1. Middleware Order Matters**

```typescript
// ✅ CORRECT ORDER
router.get(
  '/users/:userId',
  validateUserIdParam,  // 1. Validate input first
  authenticate,         // 2. Then authenticate
  requireOwnership,     // 3. Then check ownership
  controller           // 4. Finally execute controller
);

// ❌ WRONG ORDER
router.get(
  '/users/:userId',
  controller,          // Controller runs before auth!
  authenticate,        // Too late!
  validateUserIdParam  // Never reached!
);
```

### **2. Always Use AuthenticatedRequest Type**

```typescript
// ✅ CORRECT
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const controller = (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; // TypeScript knows about req.user
};

// ❌ WRONG
const controller = (req: Request, res: Response) => {
  const userId = req.user?.userId; // TypeScript error!
};
```

### **3. Error Handler Must Be Last**

```typescript
// ✅ CORRECT
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use(notFoundHandler);
app.use(errorHandler); // LAST

// ❌ WRONG
app.use(errorHandler); // Too early!
app.use('/api/auth', authRoutes); // Won't catch errors here
```

### **4. Use asyncHandler for Async Routes**

```typescript
// ✅ CORRECT
import { asyncHandler } from '../middleware';

router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json({ success: true, data: users });
}));

// ❌ WRONG (unhandled promise rejection)
router.get('/users', async (req, res) => {
  const users = await User.find(); // If error occurs, crashes server
  res.json({ success: true, data: users });
});
```

### **5. Validate Input Before Business Logic**

```typescript
// ✅ CORRECT
router.post('/signup', validateSignupData, signup);

// ❌ WRONG (validation in controller)
router.post('/signup', signup); // No validation!
```

---

## 🔄 **Middleware Flow Diagram**

```
Client Request
     ↓
express.json() ────────────────→ Parse request body
     ↓
Route Matching ────────────────→ Find matching route
     ↓
validateSignupData ────────────→ Validate input
     ↓                              ├─ Invalid → 400 Error
     ↓                              └─ Valid → Continue
authenticate ──────────────────→ Verify JWT token
     ↓                              ├─ Invalid → 401 Error
     ↓                              └─ Valid → Attach user to req
requireOwnership ──────────────→ Check ownership
     ↓                              ├─ Not owner → 403 Error
     ↓                              └─ Owner → Continue
Controller ────────────────────→ Execute business logic
     ↓
Response to Client
```

---

## 📚 **Related Documentation**

- **[Auth Controller Documentation](./auth-controller-documentation.md)** - Controller implementation
- **[Auth Routes Documentation](./auth-routes-documentation.md)** - Route definitions
- **[Authentication Testing Guide](./authentication-testing-guide.md)** - Testing instructions

---

*Last Updated: October 13, 2025*
*Version: 1.0.0*
