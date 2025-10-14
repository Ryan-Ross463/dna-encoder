# Middleware Quick Reference

## 🚀 **Quick Setup**

### **Import Middleware**
```typescript
import {
  // Authentication
  authenticate,
  optionalAuthenticate,
  requireOwnership,
  AuthenticatedRequest,
  
  // Validation
  validateSignupData,
  validateLoginData,
  validateUserIdParam,
  validateUpdateData,
  
  // Error Handling
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
} from '../middleware';
```

---

## 📋 **Middleware Cheat Sheet**

### **Authentication Middleware**

| Middleware | Purpose | When to Use |
|------------|---------|-------------|
| `authenticate` | Require valid JWT token | Protected routes (user must be logged in) |
| `optionalAuthenticate` | Try to authenticate, but continue if no token | Public routes with personalized content |
| `requireOwnership` | Verify user owns resource | User-specific endpoints (profile, settings) |

---

### **Validation Middleware**

| Middleware | Purpose | Validates |
|------------|---------|-----------|
| `validateSignupData` | Signup request validation | userName, email, password |
| `validateLoginData` | Login request validation | email, password |
| `validateUserIdParam` | URL parameter validation | userId (UUID format) |
| `validateUpdateData` | Update request validation | userName and/or email |

---

### **Error Handling Middleware**

| Middleware | Purpose | Usage |
|------------|---------|-------|
| `errorHandler` | Global error handler | Add at end of index.ts |
| `notFoundHandler` | Handle 404 errors | Add before errorHandler |
| `asyncHandler` | Wrap async routes | Wrap async controllers |
| `AppError` | Custom error class | Throw in controllers |

---

## 🎯 **Common Patterns**

### **Pattern 1: Public Route**
```typescript
// No middleware needed
router.post('/signup', validateSignupData, signup);
router.post('/login', validateLoginData, login);
```

---

### **Pattern 2: Protected Route**
```typescript
// Requires authentication
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);
```

---

### **Pattern 3: User-Specific Route**
```typescript
// Requires authentication + ownership verification
router.get(
  '/users/:userId',
  validateUserIdParam,
  authenticate,
  requireOwnership,
  getUserProfile
);

router.put(
  '/users/:userId',
  validateUserIdParam,
  authenticate,
  requireOwnership,
  validateUpdateData,
  updateUserProfile
);
```

---

### **Pattern 4: Optional Authentication**
```typescript
// Works with or without authentication
router.get('/content', optionalAuthenticate, getContent);

const getContent = (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    // Authenticated - personalized
    return res.json({ message: `Hello, ${req.user.userName}!` });
  } else {
    // Not authenticated - generic
    return res.json({ message: 'Hello, guest!' });
  }
};
```

---

### **Pattern 5: Async Route with Error Handling**
```typescript
import { asyncHandler } from '../middleware';

router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find(); // Errors automatically caught
  res.json({ success: true, data: users });
}));
```

---

## 🔧 **Setup in index.ts**

```typescript
import express from 'express';
import { notFoundHandler, errorHandler } from './middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app = express();

// 1. Body parsers
app.use(express.json());

// 2. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 3. 404 handler (after routes)
app.use(notFoundHandler);

// 4. Error handler (last)
app.use(errorHandler);
```

---

## 📝 **Controller Template**

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// For protected routes
export const protectedController = (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = req.user; // { userId, email, userName }
  const token = req.token; // JWT token string
  
  // Your logic here
  res.json({
    success: true,
    data: { user }
  });
};

// For optional auth routes
export const optionalController = (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (req.user) {
    // User authenticated
    res.json({ message: `Welcome, ${req.user.userName}!` });
  } else {
    // User not authenticated
    res.json({ message: 'Welcome, guest!' });
  }
};
```

---

## ✅ **Middleware Order Rules**

```
1. Validation     ← Validate input first
2. Authentication ← Then verify identity
3. Authorization  ← Then check permissions
4. Controller     ← Finally execute logic
```

**Example**:
```typescript
router.put(
  '/users/:userId',
  validateUserIdParam,  // 1. Validate
  authenticate,         // 2. Authenticate
  requireOwnership,     // 3. Authorize
  validateUpdateData,   // 4. Validate body
  updateUser           // 5. Execute
);
```

---

## 🔒 **Authorization Header Format**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
               ↑      ↑
               Type   Token (from login response)
```

**In Code**:
```typescript
const token = loginResponse.data.token;
const headers = {
  'Authorization': `Bearer ${token}`
};
```

---

## ⚠️ **Common Errors**

### **Error 1: req.user is undefined**
**Problem**: Forgot to use `authenticate` middleware
```typescript
// ❌ Wrong
router.get('/profile', getProfile);

// ✅ Correct
router.get('/profile', authenticate, getProfile);
```

---

### **Error 2: TypeScript error on req.user**
**Problem**: Using `Request` instead of `AuthenticatedRequest`
```typescript
// ❌ Wrong
const controller = (req: Request, res: Response) => {
  const userId = req.user.userId; // TypeScript error
};

// ✅ Correct
import { AuthenticatedRequest } from '../middleware/auth.middleware';
const controller = (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; // Works!
};
```

---

### **Error 3: Middleware runs in wrong order**
**Problem**: Controller before authentication
```typescript
// ❌ Wrong
router.get('/profile', getProfile, authenticate);

// ✅ Correct
router.get('/profile', authenticate, getProfile);
```

---

### **Error 4: Error handler not catching errors**
**Problem**: Error handler defined too early
```typescript
// ❌ Wrong
app.use(errorHandler);
app.use('/api/auth', authRoutes); // Errors here not caught

// ✅ Correct
app.use('/api/auth', authRoutes);
app.use(errorHandler); // Catches all errors
```

---

## 📊 **HTTP Status Codes**

| Code | Name | Used By | Meaning |
|------|------|---------|---------|
| 400 | Bad Request | Validation middleware | Invalid input |
| 401 | Unauthorized | authenticate | Not authenticated |
| 403 | Forbidden | requireOwnership | Not authorized |
| 404 | Not Found | notFoundHandler | Route not found |
| 500 | Internal Error | errorHandler | Server error |

---

## 🎓 **Testing Middleware**

### **Test Authentication**
```powershell
# Without token (should fail)
Invoke-WebRequest -Uri "http://localhost:3001/api/protected" -Method GET

# With token (should succeed)
$token = "eyJhbGci..."
Invoke-WebRequest -Uri "http://localhost:3001/api/protected" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### **Test Ownership**
```powershell
# User A tries to access User B's profile (should fail)
$userAToken = "..."
$userBId = "xyz789..."
Invoke-WebRequest -Uri "http://localhost:3001/api/users/$userBId" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $userAToken" }
# Response: 403 Forbidden

# User A tries to access own profile (should succeed)
$userAId = "abc123..."
Invoke-WebRequest -Uri "http://localhost:3001/api/users/$userAId" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $userAToken" }
# Response: 200 OK
```

---

## 📚 **Full Documentation**

For detailed information, see:
- **[Middleware Documentation](./middleware-documentation.md)** - Complete reference

---

*Last Updated: October 13, 2025*
