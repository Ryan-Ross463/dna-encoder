# Authentication Middleware Documentation

## Overview

The `auth.middleware.ts` module provides authentication and authorization middleware for the Object Storage service. It ensures that only authenticated users can access the API and that users can only access their own files.

**Location:** `services/object-storage/src/middleware/auth.middleware.ts`

**Purpose:** 
- Verify JWT tokens issued by the User Management service
- Protect routes from unauthorized access
- Ensure users can only access their own files (file ownership validation)

---

## Dependencies

```typescript
import { Request, Response, NextFunction } from 'express';  // Express types
import jwt from 'jsonwebtoken';                            // JWT verification
import File from '../models/File';                          // File model for ownership checks
```

---

## Type Definitions

### Global Request Extension

Extends the Express Request interface to include user authentication data:

```typescript
declare global {
  namespace Express {
    interface Request {
      userId?: string;           // User's unique identifier
      user?: {
        userId: string;          // User's unique identifier
        username?: string;       // User's username
      };
    }
  }
}
```

**Why Global Extension?**
- Makes `req.userId` and `req.user` available in all controllers
- TypeScript will recognize these properties
- No need to cast `req` in controllers

**Usage in Controllers:**
```typescript
export const myController = (req: Request, res: Response) => {
  console.log(req.userId);        // ✅ TypeScript knows this exists
  console.log(req.user?.username); // ✅ TypeScript knows this exists
};
```

---

### JWT Payload Interface

Defines the structure of decoded JWT tokens:

```typescript
interface JWTPayload {
  userId: string;      // Required: User's unique ID
  username?: string;   // Optional: User's username
  iat?: number;        // Optional: Issued at timestamp
  exp?: number;        // Optional: Expiration timestamp
}
```

**Token Example:**
```json
{
  "userId": "abc123-def456",
  "username": "john_doe",
  "iat": 1697126400,
  "exp": 1697212800
}
```

---

## Middleware Functions

### 1. `authenticate` Middleware

**Purpose:** Verifies JWT tokens and attaches user data to the request object.

**Signature:**
```typescript
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void>
```

**Process Flow:**

```
1. Extract token from Authorization header
   ↓
2. Verify JWT_SECRET is configured
   ↓
3. Verify JWT signature
   ↓
4. Attach user data to request
   ↓
5. Continue to next middleware/controller
```

---

#### Step-by-Step Breakdown

**Step 1: Extract Token from Authorization Header**

```typescript
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({
    error: 'No token provided'
  });
}

const token = authHeader.substring(7); // Remove 'Bearer ' prefix
```

**Expected Header Format:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response if Missing:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided. Please include Authorization header with Bearer token."
}
```
**HTTP Status:** 401 Unauthorized

---

**Step 2: Get JWT Secret**

```typescript
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('[Auth] JWT_SECRET not configured');
  return res.status(500).json({
    error: 'Server configuration error'
  });
}
```

**Environment Variable:**
```properties
JWT_SECRET=your-secret-key-change-in-production
```

**⚠️ Important:** Both User Management and Object Storage must use the **same JWT_SECRET** for token compatibility.

**Response if Missing:**
```json
{
  "success": false,
  "error": "Server configuration error",
  "message": "Authentication service not properly configured"
}
```
**HTTP Status:** 500 Internal Server Error

---

**Step 3: Verify JWT Signature**

```typescript
const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
```

**What Happens:**
1. Verifies token signature matches the secret
2. Checks token hasn't expired
3. Decodes payload data

**Possible Errors:**
- `JsonWebTokenError` - Invalid token signature
- `TokenExpiredError` - Token has expired

---

**Step 4: Attach User Data to Request**

```typescript
req.userId = decoded.userId;
req.user = {
  userId: decoded.userId,
  username: decoded.username,
};

console.log(`[Auth] User authenticated: ${decoded.userId}`);
```

**Result:**
- `req.userId` - Available for quick access
- `req.user` - Full user object with username

**Now available in all subsequent middleware and controllers!**

---

**Step 5: Continue to Next Middleware**

```typescript
next();
```

Passes control to the next middleware or controller in the chain.

---

#### Error Responses

**Invalid Token:**
```json
{
  "success": false,
  "error": "Invalid token",
  "message": "The provided token is invalid"
}
```
**HTTP Status:** 401 Unauthorized

**Expired Token:**
```json
{
  "success": false,
  "error": "Token expired",
  "message": "Your session has expired. Please login again."
}
```
**HTTP Status:** 401 Unauthorized

**Server Error:**
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "An error occurred during authentication"
}
```
**HTTP Status:** 500 Internal Server Error

---

#### Usage Examples

**Example 1: Protect a Single Route**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listFiles } from '../controllers/file.controller';

const router = Router();

// Only authenticated users can list files
router.get('/files', authenticate, listFiles);

export default router;
```

**Example 2: Protect Multiple Routes**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply to all routes in this router
router.use(authenticate);

router.get('/files', listFiles);
router.post('/upload', uploadFile);
router.delete('/:fileId', deleteFile);

export default router;
```

**Example 3: Access User Data in Controller**

```typescript
import { Request, Response } from 'express';

export const listFiles = async (req: Request, res: Response) => {
  // User data is available from authenticate middleware
  const userId = req.userId;  // ✅ Available
  const username = req.user?.username; // ✅ Available
  
  console.log(`User ${username} is listing files`);
  
  // Find files owned by this user
  const files = await File.findByOwner(userId);
  
  res.json({ success: true, files });
};
```

---

### 2. `requireOwnership` Middleware

**Purpose:** Ensures authenticated users can only access their own files.

**Signature:**
```typescript
export const requireOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void>
```

**⚠️ Must be used AFTER `authenticate` middleware!**

**Process Flow:**

```
1. Check if user is authenticated (req.userId exists)
   ↓
2. Get fileId from URL parameters
   ↓
3. Query database for file
   ↓
4. Compare file.ownerUserId with req.userId
   ↓
5. Allow access if match, deny if mismatch
```

---

#### Step-by-Step Breakdown

**Step 1: Check Authentication**

```typescript
if (!req.userId) {
  return res.status(401).json({
    error: 'Authentication required'
  });
}
```

**Why?** If `req.userId` is missing, `authenticate` middleware wasn't run first.

**Response:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```
**HTTP Status:** 401 Unauthorized

---

**Step 2: Get fileId from URL Parameters**

```typescript
const { fileId } = req.params;

if (!fileId) {
  return res.status(400).json({
    error: 'File ID is required'
  });
}
```

**Expected URL Format:**
```
GET /api/files/:fileId/download
DELETE /api/files/:fileId
GET /api/files/:fileId/metadata
```

**Response if Missing:**
```json
{
  "success": false,
  "error": "Bad request",
  "message": "File ID is required"
}
```
**HTTP Status:** 400 Bad Request

---

**Step 3: Find File in Database**

```typescript
const file = await File.findByFileId(fileId);

if (!file) {
  return res.status(404).json({
    error: 'File not found'
  });
}
```

**Uses Static Method:** `File.findByFileId()` (defined in File model)

**Response if Not Found:**
```json
{
  "success": false,
  "error": "File not found",
  "message": "No file found with ID: abc123-def456"
}
```
**HTTP Status:** 404 Not Found

---

**Step 4: Check Ownership**

```typescript
if (file.ownerUserId !== req.userId) {
  console.warn(`User ${req.userId} attempted to access file ${fileId} owned by ${file.ownerUserId}`);
  
  return res.status(403).json({
    error: 'Forbidden',
    message: 'You do not have permission to access this file'
  });
}
```

**Ownership Comparison:**
- `file.ownerUserId` - User who uploaded the file
- `req.userId` - User making the request
- **Must match exactly!**

**Security Log:** Logs unauthorized access attempts for security monitoring.

**Response if Not Owner:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You do not have permission to access this file"
}
```
**HTTP Status:** 403 Forbidden

---

**Step 5: Allow Access**

```typescript
console.log(`[Auth] Ownership verified: User ${req.userId} owns file ${fileId}`);
next();
```

User owns the file, proceed to controller.

---

#### Error Responses

**Not Authenticated:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```
**HTTP Status:** 401 Unauthorized

**File Not Found:**
```json
{
  "success": false,
  "error": "File not found",
  "message": "No file found with ID: abc123"
}
```
**HTTP Status:** 404 Not Found

**Not Owner:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You do not have permission to access this file"
}
```
**HTTP Status:** 403 Forbidden

**Server Error:**
```json
{
  "success": false,
  "error": "Ownership verification failed",
  "message": "An error occurred while verifying file ownership"
}
```
**HTTP Status:** 500 Internal Server Error

---

#### Usage Examples

**Example 1: Download File (Ownership Required)**

```typescript
import { Router } from 'express';
import { authenticate, requireOwnership } from '../middleware/auth.middleware';
import { downloadFile } from '../controllers/file.controller';

const router = Router();

router.get('/:fileId/download',
  authenticate,       // 1. Verify user is logged in
  requireOwnership,   // 2. Verify user owns this file
  downloadFile        // 3. Proceed with download
);

export default router;
```

**Example 2: Delete File (Ownership Required)**

```typescript
router.delete('/:fileId',
  authenticate,       // 1. Verify user is logged in
  requireOwnership,   // 2. Verify user owns this file
  deleteFile          // 3. Proceed with deletion
);
```

**Example 3: Get File Metadata (Ownership Required)**

```typescript
router.get('/:fileId/metadata',
  authenticate,       // 1. Verify user is logged in
  requireOwnership,   // 2. Verify user owns this file
  getFileMetadata     // 3. Return metadata
);
```

---

## Security Flow Diagram

### Scenario 1: Successful Access (User Owns File)

```
User A requests: GET /api/files/abc123/download
    ↓
authenticate middleware
  - Token valid? ✅ Yes
  - req.userId = 'user-a-id'
    ↓
requireOwnership middleware
  - File exists? ✅ Yes
  - file.ownerUserId = 'user-a-id'
  - req.userId = 'user-a-id'
  - Match? ✅ Yes
    ↓
downloadFile controller
  - Stream file to user
    ↓
Response: 200 OK (file download)
```

---

### Scenario 2: Unauthorized Access (User Doesn't Own File)

```
User B requests: GET /api/files/abc123/download
    ↓
authenticate middleware
  - Token valid? ✅ Yes
  - req.userId = 'user-b-id'
    ↓
requireOwnership middleware
  - File exists? ✅ Yes
  - file.ownerUserId = 'user-a-id'
  - req.userId = 'user-b-id'
  - Match? ❌ No
    ↓
Response: 403 Forbidden
  "You do not have permission to access this file"
```

**Controller is NEVER reached!** 🔒

---

### Scenario 3: Unauthenticated Access (No Token)

```
Guest requests: GET /api/files/abc123/download
    ↓
authenticate middleware
  - Token provided? ❌ No
    ↓
Response: 401 Unauthorized
  "No token provided"
```

**Both requireOwnership and controller are NEVER reached!** 🔒

---

## Complete Route Examples

### Upload File (No Ownership Check)

```typescript
router.post('/upload',
  authenticate,       // ✅ Must be logged in
  upload.single('file'), // Multer handles upload
  uploadFile          // Save metadata
);
```

**Why no `requireOwnership`?** User is creating a NEW file, not accessing existing one.

---

### Download File (Ownership Required)

```typescript
router.get('/:fileId/download',
  authenticate,       // ✅ Must be logged in
  requireOwnership,   // ✅ Must own this file
  downloadFile
);
```

---

### Delete File (Ownership Required)

```typescript
router.delete('/:fileId',
  authenticate,       // ✅ Must be logged in
  requireOwnership,   // ✅ Must own this file
  deleteFile
);
```

---

### List User's Files (No Ownership Check)

```typescript
router.get('/user/files',
  authenticate,       // ✅ Must be logged in
  listUserFiles       // Lists only YOUR files
);
```

**Why no `requireOwnership`?** Controller queries files where `ownerUserId === req.userId`.

---

## Environment Configuration

**Required Environment Variable:**

```properties
# .env file
JWT_SECRET=your-secret-key-change-in-production
```

**⚠️ Critical Requirements:**

1. **Must be the same** in both services:
   - `services/user-management/.env`
   - `services/object-storage/.env`

2. **Must be strong:**
   - At least 32 characters
   - Mix of letters, numbers, symbols
   - Never commit to Git

3. **Production:**
   - Use environment variables from hosting platform (Railway)
   - Never hardcode in source code

**Example Strong Secret:**
```
JWT_SECRET=A9f$3Kp2@mZ7!xQ5&nL8^wR4*tY6#bH1
```

---

## HTTP Status Codes

| Status | Meaning | When Used |
|--------|---------|-----------|
| **200** | OK | Successful operation |
| **201** | Created | File uploaded successfully |
| **400** | Bad Request | Missing fileId parameter |
| **401** | Unauthorized | No token or invalid token |
| **403** | Forbidden | User doesn't own the file |
| **404** | Not Found | File doesn't exist |
| **500** | Internal Server Error | Server configuration error or unexpected error |

---

## Testing

### Test Authentication

**1. Valid Token:**
```bash
curl -X GET http://localhost:3002/api/files \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"

# Expected: 200 OK
```

**2. No Token:**
```bash
curl -X GET http://localhost:3002/api/files

# Expected: 401 Unauthorized
# Response: "No token provided"
```

**3. Invalid Token:**
```bash
curl -X GET http://localhost:3002/api/files \
  -H "Authorization: Bearer invalid.token.here"

# Expected: 401 Unauthorized
# Response: "Invalid token"
```

**4. Expired Token:**
```bash
curl -X GET http://localhost:3002/api/files \
  -H "Authorization: Bearer EXPIRED_TOKEN"

# Expected: 401 Unauthorized
# Response: "Token expired. Please login again"
```

---

### Test Ownership

**Scenario: User A tries to download User B's file**

```bash
# 1. Login as User A
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usera@example.com","password":"password123"}'

# Response: { "token": "USER_A_TOKEN" }

# 2. Try to download User B's file
curl -X GET http://localhost:3002/api/files/user-b-file-id/download \
  -H "Authorization: Bearer USER_A_TOKEN"

# Expected: 403 Forbidden
# Response: "You do not have permission to access this file"
```

**Scenario: User A downloads their own file**

```bash
# Download own file
curl -X GET http://localhost:3002/api/files/user-a-file-id/download \
  -H "Authorization: Bearer USER_A_TOKEN"

# Expected: 200 OK (file downloads)
```

---

## Security Best Practices

### ✅ Do's

1. **Always use HTTPS in production**
   ```
   https://api.yourdomain.com
   ```

2. **Use strong JWT secrets**
   ```
   At least 32 random characters
   ```

3. **Set reasonable token expiration**
   ```javascript
   // In user-management service
   jwt.sign(payload, secret, { expiresIn: '24h' });
   ```

4. **Log security events**
   ```typescript
   console.warn(`Unauthorized access attempt: ${req.userId} → ${fileId}`);
   ```

5. **Validate all inputs**
   ```typescript
   if (!fileId || typeof fileId !== 'string') {
     return res.status(400).json({ error: 'Invalid fileId' });
   }
   ```

---

### ❌ Don'ts

1. **Don't log tokens**
   ```typescript
   // ❌ BAD
   console.log('Token:', token);
   
   // ✅ GOOD
   console.log('User authenticated:', userId);
   ```

2. **Don't send detailed errors to client**
   ```typescript
   // ❌ BAD
   res.status(500).json({ error: error.stack });
   
   // ✅ GOOD
   console.error('[Auth] Error:', error);
   res.status(500).json({ error: 'Authentication failed' });
   ```

3. **Don't hardcode secrets**
   ```typescript
   // ❌ BAD
   const JWT_SECRET = 'my-secret-key';
   
   // ✅ GOOD
   const JWT_SECRET = process.env.JWT_SECRET;
   ```

4. **Don't skip middleware**
   ```typescript
   // ❌ BAD
   router.get('/:fileId/download', downloadFile); // No auth!
   
   // ✅ GOOD
   router.get('/:fileId/download', authenticate, requireOwnership, downloadFile);
   ```

---

## Troubleshooting

### Issue: "No token provided"

**Cause:** Missing or malformed Authorization header

**Solutions:**
1. Check header format: `Authorization: Bearer <token>`
2. Ensure space after "Bearer"
3. Check token is not empty

**Test:**
```bash
# Wrong format
Authorization: <token>

# Correct format
Authorization: Bearer <token>
```

---

### Issue: "Invalid token"

**Cause:** Token signature doesn't match JWT_SECRET

**Solutions:**
1. Check JWT_SECRET is the same in both services
2. Token might be from different environment (dev vs prod)
3. Token might be corrupted

**Verify Secret Match:**
```bash
# Check user-management .env
cat services/user-management/.env | grep JWT_SECRET

# Check object-storage .env
cat services/object-storage/.env | grep JWT_SECRET

# Must be identical!
```

---

### Issue: "Token expired"

**Cause:** Token's `exp` claim is in the past

**Solutions:**
1. Login again to get new token
2. Increase token expiration time (in user-management service)

**Check Token Expiration:**
```javascript
// Decode token (without verifying) to see expiration
const decoded = jwt.decode(token);
console.log('Expires:', new Date(decoded.exp * 1000));
```

---

### Issue: "Forbidden" when accessing own file

**Cause:** `file.ownerUserId` doesn't match `req.userId`

**Debug Steps:**
```typescript
// Add logging in requireOwnership
console.log('File owner:', file.ownerUserId);
console.log('Request user:', req.userId);
console.log('Match?', file.ownerUserId === req.userId);
```

**Possible Causes:**
1. File was uploaded by different user
2. userId format mismatch (string vs number)
3. File model query returning wrong document

---

## Related Documentation

- [File Model Documentation](./file-model-documentation.md) - File schema and methods
- [Upload Middleware Documentation](./upload-middleware-documentation.md) - Multer configuration
- [Storage Utilities Documentation](./storage-utilities-documentation.md) - File system operations
- [User Management Auth](../user-management/middleware-documentation.md) - Token creation

---

## Summary

The authentication middleware provides:

✅ **JWT Token Verification** - Validates tokens from User Management service
✅ **User Authentication** - Ensures only logged-in users can access API
✅ **File Ownership** - Ensures users can only access their own files
✅ **Security Logging** - Logs authentication events and access attempts
✅ **Type Safety** - TypeScript support for `req.userId` and `req.user`

**Key Concept:** Two-layer security:
1. **Authentication** - Are you logged in? (Who are you?)
2. **Authorization** - Do you own this file? (Can you access this?)

---

**Last Updated:** October 13, 2025  
**Version:** 1.0.0  
**Author:** DNA Encoder Development Team
