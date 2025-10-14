# Understanding requireOwnership & Error Middleware

## 📚 **Simple Explanation for Beginners**

This documentation explains two important middleware systems:
1. **requireOwnership** - Prevents users from accessing other users' data
2. **Error Handling Middleware** - Catches and handles errors gracefully

---

## 🔐 **Part 1: requireOwnership Middleware**

### **What Problem Does It Solve?**

Imagine you have a social media app:
- Alice has account ID: `abc-123`
- Bob has account ID: `xyz-789`

**Without `requireOwnership`:**
```
Alice logs in and gets her token.
Alice changes the URL to Bob's profile:
  /users/xyz-789

Result: Alice can see (or even change!) Bob's data! 🚨
This is BAD - it's a security hole!
```

**With `requireOwnership`:**
```
Alice logs in and gets her token.
Alice tries to access Bob's profile:
  /users/xyz-789

Result: Server says "403 Forbidden - You can only access your own data" ✅
Alice can ONLY access her own profile:
  /users/abc-123 ✅
```

---

## 📖 **How requireOwnership Works - Step by Step**

### **The Code:**
```typescript
export const requireOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Step 1: Get the userId from the URL
    const requestedUserId = req.params.userId;
    // Example: /users/xyz-789 → requestedUserId = "xyz-789"

    // Step 2: Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    // Step 3: Compare the authenticated user's ID with the requested ID
    if (req.user.userId !== requestedUserId) {
      // They don't match! User is trying to access someone else's data!
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
          hint: 'You can only access your own data',
        },
      });
      return;
    }

    // Step 4: IDs match - user owns this resource!
    console.log('[Middleware] Ownership verified:', req.user.email);
    next(); // Continue to the controller
  } catch (error) {
    console.error('[Middleware] Ownership check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'OWNERSHIP_CHECK_ERROR',
        message: 'Failed to verify ownership',
      },
    });
  }
};
```

---

## 🎯 **Visual Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│ USER REQUEST                                                │
│ GET /users/xyz-789                                          │
│ Authorization: Bearer alice-token                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: authenticate middleware runs first                  │
│ ├─ Verifies alice-token is valid                            │
│ ├─ Attaches Alice's data to req.user                        │
│ └─ req.user = { userId: "abc-123", email: "alice@..." }    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: requireOwnership middleware runs                    │
│ ├─ Extracts from URL: requestedUserId = "xyz-789"          │
│ ├─ Gets from token: req.user.userId = "abc-123"            │
│ └─ Compares: "abc-123" !== "xyz-789" ❌                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ RESULT: Return 403 Forbidden                                │
│ {                                                           │
│   "success": false,                                         │
│   "error": {                                                │
│     "code": "FORBIDDEN",                                    │
│     "message": "You do not have permission..."             │
│   }                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Comparison: With vs Without requireOwnership**

### **Scenario 1: Alice Accesses Her Own Profile**

#### **Route Setup:**
```typescript
router.get('/users/:userId', authenticate, requireOwnership, getUserProfile);
```

#### **Request:**
```http
GET /users/abc-123
Authorization: Bearer alice-token
```

#### **What Happens:**
```
1. authenticate: ✅ Token valid → req.user.userId = "abc-123"
2. requireOwnership: 
   - requestedUserId = "abc-123" (from URL)
   - req.user.userId = "abc-123" (from token)
   - Compare: "abc-123" === "abc-123" ✅ MATCH!
3. Controller: Returns Alice's profile data ✅
```

---

### **Scenario 2: Alice Tries to Access Bob's Profile**

#### **Request:**
```http
GET /users/xyz-789
Authorization: Bearer alice-token
```

#### **What Happens:**
```
1. authenticate: ✅ Token valid → req.user.userId = "abc-123"
2. requireOwnership: 
   - requestedUserId = "xyz-789" (from URL)
   - req.user.userId = "abc-123" (from token)
   - Compare: "abc-123" !== "xyz-789" ❌ NO MATCH!
3. Response: 403 Forbidden ❌
4. Controller: NEVER REACHED (blocked by middleware)
```

---

## 📝 **Usage Examples**

### **Example 1: Protect User Profile Routes**

```typescript
import { authenticate, requireOwnership } from '../middleware';

// Get user profile - only the owner can view
router.get(
  '/users/:userId',
  authenticate,        // Step 1: Verify token
  requireOwnership,    // Step 2: Verify ownership
  getUserProfile       // Step 3: Return data
);

// Update user profile - only the owner can update
router.put(
  '/users/:userId',
  authenticate,
  requireOwnership,
  updateUserProfile
);

// Delete user account - only the owner can delete
router.delete(
  '/users/:userId',
  authenticate,
  requireOwnership,
  deleteUser
);
```

---

### **Example 2: In Your DNA Encoder Project**

```typescript
// DNA Data Routes
router.get(
  '/users/:userId/dna-data',
  authenticate,
  requireOwnership,    // ✅ Only user can view their own DNA data
  getDNAData
);

router.post(
  '/users/:userId/dna-data',
  authenticate,
  requireOwnership,    // ✅ Only user can upload their own DNA data
  uploadDNAData
);

// Without requireOwnership:
// Alice could upload DNA data to Bob's account! 🚨
// Alice could view Bob's sensitive genetic information! 🚨
```

---

## ⚠️ **Error Responses from requireOwnership**

### **Error 1: Not Authenticated (401)**

**When:** `authenticate` middleware was not used before `requireOwnership`

```json
{
  "success": false,
  "error": {
    "code": "NOT_AUTHENTICATED",
    "message": "User not authenticated",
    "hint": "This middleware requires authenticate middleware first"
  }
}
```

**Fix:** Always use `authenticate` before `requireOwnership`
```typescript
// ❌ Wrong
router.get('/users/:userId', requireOwnership, getUser);

// ✅ Correct
router.get('/users/:userId', authenticate, requireOwnership, getUser);
```

---

### **Error 2: Forbidden (403)**

**When:** User tries to access resource they don't own

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

**This is the EXPECTED behavior** - it's working correctly!

---

### **Error 3: Ownership Check Error (500)**

**When:** Unexpected error during ownership check

```json
{
  "success": false,
  "error": {
    "code": "OWNERSHIP_CHECK_ERROR",
    "message": "Failed to verify ownership"
  }
}
```

---

## ⚠️ **Part 2: Error Handling Middleware**

### **What Problem Does It Solve?**

**Without Error Middleware:**
```javascript
// If an error occurs...
const user = await User.findOne({ userId: undefined });
// Server crashes! 💥
// User sees: "Cannot GET /users/undefined"
// No helpful error message
```

**With Error Middleware:**
```javascript
// If an error occurs...
const user = await User.findOne({ userId: undefined });
// Error is caught by middleware
// User sees: Proper JSON error response
// Server stays running ✅
```

---

## 📦 **The Error Handling System - 3 Parts**

### **1. AppError Class - Custom Errors**

```typescript
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
```

**What it does:**
- Creates custom errors with HTTP status codes
- Allows you to throw specific errors in controllers

**Usage in Controller:**
```typescript
import { AppError } from '../middleware';

const getUser = async (req: Request, res: Response) => {
  const user = await User.findOne({ userId: req.params.userId });
  
  if (!user) {
    // Throw custom error
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  res.json({ user });
};
```

---

### **2. errorHandler - Global Error Handler**

```typescript
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: string | undefined;

  // If it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  } else {
    // Standard JavaScript errors
    message = err.message || message;
  }

  // Show stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    details = err.stack;
  }

  // Log error to console
  console.error('[Error Handler]', {
    code: errorCode,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Send JSON error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details,
      path: req.path,
      timestamp: new Date().toISOString(),
    },
  });
};
```

**What it does:**
- Catches ALL errors in your application
- Formats them into consistent JSON responses
- Logs errors to console
- Hides sensitive details in production

---

### **3. notFoundHandler - 404 Handler**

```typescript
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.path,
      method: req.method,
      hint: 'Check the API documentation for available endpoints',
    },
  });
};
```

**What it does:**
- Handles requests to undefined routes
- Returns consistent 404 error

---

## 🔧 **How to Set Up Error Middleware**

### **In `index.ts`:**

```typescript
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware';
import authRoutes from './routes/auth.routes';

const app = express();

// 1. Body parsers
app.use(express.json());

// 2. Define all your routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 3. 404 handler (AFTER routes, BEFORE error handler)
app.use(notFoundHandler);

// 4. Error handler (MUST BE LAST!)
app.use(errorHandler);

app.listen(3001);
```

**⚠️ ORDER MATTERS:**
```
Routes → notFoundHandler → errorHandler
  ↓           ↓                ↓
Handle    Catch 404       Catch all
requests   errors          other errors
```

---

## 📊 **Error Flow Diagram**

```
┌─────────────────────────────────────────────────────────┐
│ REQUEST: GET /api/users/invalid-id                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ ROUTE: /api/users/:userId                               │
│ Controller: getUserProfile()                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ CONTROLLER THROWS ERROR                                 │
│ throw new AppError('User not found', 404, 'NOT_FOUND'); │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ ERROR HANDLER CATCHES IT                                │
│ ├─ Recognizes AppError                                  │
│ ├─ Extracts: statusCode = 404                           │
│ ├─ Extracts: code = 'NOT_FOUND'                         │
│ ├─ Logs error to console                                │
│ └─ Sends JSON response                                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ RESPONSE TO CLIENT                                      │
│ Status: 404 Not Found                                   │
│ {                                                       │
│   "success": false,                                     │
│   "error": {                                            │
│     "code": "NOT_FOUND",                                │
│     "message": "User not found",                        │
│     "path": "/api/users/invalid-id",                    │
│     "timestamp": "2025-10-13T..."                       │
│   }                                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 **asyncHandler - Bonus Helper**

### **The Problem:**
```typescript
// Without asyncHandler - manual try-catch everywhere
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    // Have to handle error manually
    res.status(500).json({ error: error.message });
  }
});
```

### **The Solution:**
```typescript
import { asyncHandler } from '../middleware';

// With asyncHandler - automatic error handling
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json({ users });
}));
// Errors are automatically caught and sent to errorHandler!
```

**How it works:**
```typescript
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
    //                                   ↑
    //                    If error occurs, pass it to next()
    //                    next() sends it to errorHandler
  };
};
```

---

## 🎯 **Real-World Usage Examples**

### **Example 1: Using AppError in Controller**

```typescript
import { AppError } from '../middleware';

export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  
  const user = await User.findOne({ userId });
  
  // Throw custom error if user not found
  if (!user) {
    throw new AppError(
      'User not found',      // Message
      404,                   // Status code
      'USER_NOT_FOUND'       // Error code
    );
  }
  
  // Prevent deletion of last admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 1) {
      throw new AppError(
        'Cannot delete the last admin user',
        403,
        'LAST_ADMIN'
      );
    }
  }
  
  await user.deleteOne();
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
};
```

---

### **Example 2: Complete Route with All Middleware**

```typescript
import { 
  authenticate, 
  requireOwnership, 
  asyncHandler 
} from '../middleware';

// DELETE /users/:userId
router.delete(
  '/users/:userId',
  authenticate,        // 1. Verify JWT token
  requireOwnership,    // 2. Verify user owns resource
  asyncHandler(        // 3. Catch async errors
    deleteUser         // 4. Execute controller
  )
);

// If any error occurs in deleteUser, asyncHandler catches it
// and passes it to errorHandler automatically!
```

---

## 📈 **Benefits Summary**

### **requireOwnership Benefits:**
- ✅ **Security**: Prevents unauthorized data access
- ✅ **Authorization**: Enforces user permissions
- ✅ **Consistency**: Same check across all routes
- ✅ **Simplicity**: Controllers don't need ownership checks
- ✅ **Compliance**: Required for GDPR, HIPAA, etc.

### **Error Middleware Benefits:**
- ✅ **Consistency**: All errors formatted the same way
- ✅ **Logging**: Automatic error logging
- ✅ **Security**: Hides sensitive details in production
- ✅ **User Experience**: Clear, helpful error messages
- ✅ **Debugging**: Easy to trace errors with timestamps and paths

---

## 🎓 **Key Takeaways**

### **requireOwnership:**
1. Always use AFTER `authenticate` middleware
2. Protects user-specific routes (with `:userId` in URL)
3. Compares authenticated user ID with requested user ID
4. Returns 403 Forbidden if they don't match

### **Error Handling:**
1. `errorHandler` must be LAST in `index.ts`
2. `notFoundHandler` comes BEFORE `errorHandler`
3. Use `AppError` to throw custom errors in controllers
4. Use `asyncHandler` to wrap async controllers

---

## 📚 **Related Documentation**

- **[Middleware Documentation](./middleware-documentation.md)** - Complete middleware reference
- **[Middleware Quick Reference](./middleware-quick-reference.md)** - Quick cheat sheet
- **[Auth Controller Documentation](./auth-controller-documentation.md)** - Controller patterns

---

*Last Updated: October 13, 2025*
*This documentation is designed to be beginner-friendly and easy to understand!*
