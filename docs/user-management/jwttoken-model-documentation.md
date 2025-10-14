# JWTToken Model Documentation

## 📋 Overview

The **JWTToken Model** manages JSON Web Tokens (JWTs) for user authentication and session management in the DNA Encoder User Management Service. It stores issued tokens, tracks their lifecycle, and provides mechanisms for token validation and revocation.

**Location:** `services/user-management/src/models/JWTToken.ts`

**Collection Name:** `jwttokens` (MongoDB collection)

---

## 🎯 Purpose & Role

### **Primary Purpose:**
The JWTToken Model serves as the **centralized token management system** for authentication and session control. It provides:

1. **Token Storage** - Persists issued JWT tokens for tracking
2. **Session Management** - Tracks active user sessions across devices
3. **Token Revocation** - Implements logout functionality
4. **Security Control** - Prevents use of expired or revoked tokens
5. **Audit Trail** - Records token issuance and expiration

---

### **Why Store JWTs in Database?**

**Common Question:** "Aren't JWTs supposed to be stateless?"

**Answer:** Yes, but storing them provides critical features:

| Feature | Stateless JWT Only | JWT + Database Storage |
|---------|-------------------|------------------------|
| **Logout** | ❌ Cannot revoke tokens | ✅ Can revoke tokens |
| **Force logout** | ❌ Not possible | ✅ Revoke all user tokens |
| **Track sessions** | ❌ No visibility | ✅ See all active sessions |
| **Security** | ⚠️ Compromised token valid until expiry | ✅ Can revoke immediately |
| **Multi-device** | ⚠️ No control | ✅ Manage device sessions |

---

### **Role in the System:**

```
┌─────────────────────────────────────────────────┐
│           JWTToken Model's Role                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Token Registry                              │
│     └─ Stores all issued tokens                │
│                                                 │
│  2. Session Management                          │
│     └─ Tracks active user sessions             │
│                                                 │
│  3. Logout Implementation                       │
│     └─ Revokes tokens (logout)                 │
│                                                 │
│  4. Security Control                            │
│     └─ Validates token status before use       │
│                                                 │
│  5. Audit & Compliance                          │
│     └─ Records who has access and when         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Token Lifecycle

```
1. User logs in
   ↓
2. Server generates JWT
   ↓
3. JWTToken document created in database
   {
     token: "eyJhbG...",
     ownerUserId: "user-123",
     expiresAt: "2025-10-19T...",
     isRevoked: false
   }
   ↓
4. Token sent to client
   ↓
5. Client uses token for requests
   ↓
6. Server validates:
   - JWT signature valid? ✅
   - Token in database? ✅
   - Token expired? ❌
   - Token revoked? ❌
   ↓
7. Access granted
   ↓
8. User logs out OR token expires
   ↓
9. Token marked as revoked in database
   {
     isRevoked: true
   }
   ↓
10. Token no longer valid
```

---

## 📊 Data Structure

### **Schema Definition:**

```typescript
{
  tokenId: string,         // Unique identifier (UUID v4)
  ownerUserId: string,     // Reference to User (userId)
  token: string,           // The actual JWT string
  expiresAt: Date,         // Expiration timestamp
  isRevoked: boolean,      // Revocation status
  createdAt: Date,         // Token creation timestamp
  updatedAt: Date          // Last modification timestamp
}
```

---

### **Field Descriptions:**

#### **1. tokenId (String)**
```typescript
tokenId: {
  type: String,
  required: true,
  unique: true,
  default: () => uuidv4(),
  index: true
}
```

**Purpose:** Unique identifier for each token record

**Characteristics:**
- ✅ Automatically generated using UUID v4
- ✅ Guaranteed to be unique
- ✅ Indexed for fast lookups
- ✅ Independent from JWT token string

**Example:** `"t1a2b3c4-d5e6-7890-abcd-ef1234567890"`

**Why separate from JWT token?**
- Database-friendly identifier
- Can reference token without exposing JWT
- Useful for admin operations
- Consistent with User model pattern

---

#### **2. ownerUserId (String)**
```typescript
ownerUserId: {
  type: String,
  required: true,
  ref: 'User',  // References User model
  index: true
}
```

**Purpose:** Links the token to its owner (User)

**Characteristics:**
- ✅ Required field (every token has an owner)
- ✅ References User model (foreign key)
- ✅ Indexed for performance
- ✅ Used for finding all user's tokens

**Example:** `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"` (User's userId)

**Relationship:**
```
User.userId ←─────┐
                  │ (references)
JWTToken.ownerUserId ───┘
```

**Use Cases:**
- Find all tokens for a user
- Revoke all user tokens (logout from all devices)
- Identify token owner during validation
- User activity tracking

---

#### **3. token (String)**
```typescript
token: {
  type: String,
  required: true,
  unique: true,
  index: true
}
```

**Purpose:** Stores the actual JWT token string

**Characteristics:**
- ✅ Required and unique
- ✅ Indexed for fast lookups
- ✅ Hidden from JSON responses (security)
- ✅ Large string (typically 200-500 characters)

**Example:** `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMWIyYzNkNC..."`

**JWT Structure:**
```
Header.Payload.Signature
  │      │        │
  │      │        └─ Cryptographic signature
  │      └─ User data (userId, email, etc.)
  └─ Algorithm info (HS256, RS256)
```

**Security Notes:**
- Never exposed in API responses (JSON transformation hides it)
- Only used for internal validation
- Contains user information (payload)
- Cannot be modified without invalidating signature

---

#### **4. expiresAt (Date)**
```typescript
expiresAt: {
  type: Date,
  required: true,
  index: true
}
```

**Purpose:** Timestamp when the token expires

**Characteristics:**
- ✅ Required field
- ✅ Indexed for expiration queries
- ✅ Set during token creation
- ✅ Cannot be extended (must issue new token)

**Example:** `2025-10-19T10:30:45.123Z` (7 days from creation)

**How it's calculated:**
```typescript
// If JWT_EXPIRATION=7d in .env
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
```

**Use Cases:**
- Check if token is still valid
- Find expired tokens for cleanup
- Display "session expires in X hours" to users
- Automatic session timeout

**Important:** This mirrors the expiration in the JWT itself for double-checking.

---

#### **5. isRevoked (Boolean)**
```typescript
isRevoked: {
  type: Boolean,
  default: false,
  index: true
}
```

**Purpose:** Indicates if the token has been manually revoked (logged out)

**Characteristics:**
- ✅ Defaults to false (active)
- ✅ Indexed for revocation queries
- ✅ Set to true on logout
- ✅ Permanent (cannot be un-revoked)

**States:**
- `false` = Token is active (default)
- `true` = Token has been revoked (logout)

**Use Cases:**
- Implement logout functionality
- Invalidate compromised tokens
- Force logout from specific device
- Logout from all devices

**Workflow:**
```typescript
// User logs in
isRevoked: false  // Active

// User logs out
isRevoked: true   // Revoked

// User tries to use token again
// Server checks: isRevoked === true → Reject request
```

---

#### **6. createdAt (Date)**
```typescript
timestamps: true  // Auto-generates createdAt
```

**Purpose:** Records when the token was issued

**Characteristics:**
- ✅ Automatically set by Mongoose
- ✅ Cannot be modified
- ✅ Used for audit trails

**Example:** `2025-10-12T10:30:45.123Z`

**Use Cases:**
- Display "logged in 2 hours ago"
- Track authentication patterns
- Audit security events
- Find tokens issued in specific time period

---

#### **7. updatedAt (Date)**
```typescript
timestamps: true  // Auto-generates updatedAt
```

**Purpose:** Records when the token document was last modified

**Characteristics:**
- ✅ Automatically updated on every save
- ✅ Updated when token is revoked
- ✅ Used for tracking changes

**Example:** `2025-10-12T15:45:20.789Z`

**Common update:** When `isRevoked` changes from `false` to `true`

---

## 🔧 Instance Methods

Instance methods are called on individual token documents.

### **1. revoke()**

```typescript
token.revoke(): Promise<IJWTToken>
```

**Purpose:** Revoke the token (implement logout)

**How it works:**
```typescript
this.isRevoked = true;
return await this.save();
```

**Example Usage:**
```typescript
const token = await JWTToken.findByToken(providedToken);

if (token) {
  await token.revoke();
  console.log('User logged out successfully');
}
```

**Use Cases:**
- User clicks "Logout" button
- Admin revokes user access
- Security: Invalidate compromised token
- Force re-authentication

**What happens after revocation:**
- Token marked as `isRevoked: true`
- `updatedAt` timestamp updated
- Any future requests with this token are rejected

---

### **2. isExpired()**

```typescript
token.isExpired(): boolean
```

**Purpose:** Check if the token has expired

**How it works:**
```typescript
return new Date() > this.expiresAt;
```

**Example Usage:**
```typescript
const token = await JWTToken.findByToken(providedToken);

if (token.isExpired()) {
  console.log('Token has expired, please login again');
} else {
  console.log('Token is still valid');
}
```

**Returns:**
- `true` = Token expired (past expiresAt date)
- `false` = Token not expired (before expiresAt date)

**Use Cases:**
- Validate token before processing request
- Display "session expired" message
- Automatic session timeout
- Cleanup expired tokens

---

### **3. isValid()**

```typescript
token.isValid(): boolean
```

**Purpose:** Check if token is valid (not expired AND not revoked)

**How it works:**
```typescript
return !this.isExpired() && !this.isRevoked;
```

**Example Usage:**
```typescript
const token = await JWTToken.findByToken(providedToken);

if (token.isValid()) {
  console.log('✅ Token is valid - access granted');
} else {
  console.log('❌ Token is invalid - access denied');
}
```

**Validation Logic:**
```
isValid() = true  IF:
  ✅ Current time < expiresAt
  AND
  ✅ isRevoked === false

isValid() = false IF:
  ❌ Current time > expiresAt (expired)
  OR
  ❌ isRevoked === true (logged out)
```

**This is the primary method for token validation!**

---

## 📡 Static Methods

Static methods are called on the model itself (not instances).

### **1. findByToken(token)**

```typescript
JWTToken.findByToken(token: string): Promise<IJWTToken | null>
```

**Purpose:** Find a token document by the JWT string

**Example Usage:**
```typescript
const tokenDoc = await JWTToken.findByToken('eyJhbGc...');

if (tokenDoc) {
  console.log('Token found for user:', tokenDoc.ownerUserId);
} else {
  console.log('Token not found in database');
}
```

**Use Cases:**
- Validate incoming token from request
- Check token status during authentication
- Primary method for token lookup

---

### **2. findByUserId(userId)**

```typescript
JWTToken.findByUserId(userId: string): Promise<IJWTToken[]>
```

**Purpose:** Find ALL tokens for a specific user

**Example Usage:**
```typescript
const userTokens = await JWTToken.findByUserId('user-123');

console.log(`User has ${userTokens.length} tokens`);

userTokens.forEach(token => {
  console.log(`- Created: ${token.createdAt}, Revoked: ${token.isRevoked}`);
});
```

**Returns:** Array of all tokens (active and revoked)

**Use Cases:**
- Display "Active sessions" in user settings
- Admin view of user's login history
- Security audit
- Identify suspicious activity

---

### **3. findActiveTokensByUserId(userId)**

```typescript
JWTToken.findActiveTokensByUserId(userId: string): Promise<IJWTToken[]>
```

**Purpose:** Find ONLY active (valid) tokens for a user

**How it works:**
```typescript
return this.find({
  ownerUserId: userId,
  isRevoked: false,
  expiresAt: { $gt: new Date() }
});
```

**Example Usage:**
```typescript
const activeSessions = await JWTToken.findActiveTokensByUserId('user-123');

console.log(`User has ${activeSessions.length} active sessions:`);
activeSessions.forEach(token => {
  console.log(`- Expires: ${token.expiresAt}`);
});
```

**Filters:**
- ✅ Only tokens where `isRevoked === false`
- ✅ Only tokens where `expiresAt > now`

**Use Cases:**
- Display "You are logged in on 3 devices"
- Limit concurrent sessions
- Security monitoring
- Session management UI

---

### **4. revokeAllUserTokens(userId)**

```typescript
JWTToken.revokeAllUserTokens(userId: string): Promise<any>
```

**Purpose:** Revoke ALL tokens for a user (logout from all devices)

**How it works:**
```typescript
return this.updateMany(
  { ownerUserId: userId, isRevoked: false },
  { $set: { isRevoked: true } }
);
```

**Example Usage:**
```typescript
await JWTToken.revokeAllUserTokens('user-123');
console.log('User logged out from all devices');
```

**Use Cases:**
- User clicks "Logout from all devices"
- Password changed (security measure)
- Account compromised
- Admin action
- User deactivation

**What happens:**
- All user's tokens marked as `isRevoked: true`
- User must login again on all devices
- Cannot use any old tokens

---

### **5. cleanupExpiredTokens()**

```typescript
JWTToken.cleanupExpiredTokens(): Promise<any>
```

**Purpose:** Delete expired tokens from database (maintenance)

**How it works:**
```typescript
return this.deleteMany({
  expiresAt: { $lt: new Date() }
});
```

**Example Usage:**
```typescript
// Run as a scheduled job (e.g., daily)
const result = await JWTToken.cleanupExpiredTokens();
console.log(`Deleted ${result.deletedCount} expired tokens`);
```

**Why cleanup?**
- Database storage optimization
- Improve query performance
- Compliance with data retention policies
- Reduce collection size

**Recommended:** Run this as a cron job (daily or weekly)

---

## 🔒 Security Features

### **1. Token String Hidden in API Responses**

```typescript
JWTTokenSchema.set('toJSON', {
  transform: function (_doc, ret) {
    return {
      tokenId: ret.tokenId,
      ownerUserId: ret.ownerUserId,
      expiresAt: ret.expiresAt,
      isRevoked: ret.isRevoked,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
    };
  },
});
```

**Security Benefit:** Token string NEVER exposed in API responses

**Example:**
```typescript
const tokenDoc = await JWTToken.findByToken('eyJhbGc...');

// When sending as JSON
res.json(tokenDoc);

// Client receives (NO actual token):
{
  "tokenId": "t1a2b3...",
  "ownerUserId": "user-123",
  "expiresAt": "2025-10-19T...",
  "isRevoked": false,
  "createdAt": "2025-10-12T...",
  "updatedAt": "2025-10-12T..."
}

// The actual JWT token is NOT included
```

---

### **2. Double Validation**

**Layer 1: JWT Signature Validation**
```typescript
const decoded = jwt.verify(token, JWT_SECRET);
// Verifies token hasn't been tampered with
```

**Layer 2: Database Validation**
```typescript
const tokenDoc = await JWTToken.findByToken(token);
if (!tokenDoc || !tokenDoc.isValid()) {
  throw new Error('Invalid token');
}
```

**Why both?**
- JWT validation ensures integrity
- Database validation enables revocation
- Combined: Most secure approach

---

### **3. Revocation System**

Unlike stateless JWTs, this system can immediately invalidate tokens:

```typescript
// Compromised token detected
const token = await JWTToken.findByToken(suspiciousToken);
await token.revoke();

// Token immediately invalid everywhere
```

---

## 🚀 Performance Optimization

### **Indexes:**

```typescript
JWTTokenSchema.index({ tokenId: 1 });
JWTTokenSchema.index({ ownerUserId: 1 });
JWTTokenSchema.index({ token: 1 });
JWTTokenSchema.index({ expiresAt: 1 });
JWTTokenSchema.index({ isRevoked: 1 });
JWTTokenSchema.index({ ownerUserId: 1, isRevoked: 1 }); // Compound
```

**Compound Index Benefits:**
```typescript
// Single query uses both fields efficiently
JWTToken.find({ ownerUserId: 'user-123', isRevoked: false });
// ↑ Uses compound index - VERY fast
```

**Performance Impact:**
```
Finding token by token string:
- Without index: 2000ms (scan all tokens)
- With index: 3ms (direct lookup)

Finding active user tokens:
- Without compound index: 100ms
- With compound index: 5ms
```

---

## 📝 Usage Examples

### **Example 1: Issue a New Token (Login)**

```typescript
import jwt from 'jsonwebtoken';
import JWTToken from './models/JWTToken';

// User successfully authenticated
const user = await User.findByEmail('user@example.com');

// Generate JWT
const tokenString = jwt.sign(
  { userId: user.userId, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRATION } // '7d'
);

// Calculate expiration date
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

// Store in database
const tokenDoc = new JWTToken({
  ownerUserId: user.userId,
  token: tokenString,
  expiresAt: expiresAt,
});

await tokenDoc.save();

// Send token to client
res.json({ token: tokenString });
```

---

### **Example 2: Validate Token (Protected Route)**

```typescript
// Middleware to protect routes
async function authenticateToken(req, res, next) {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Step 1: Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 2: Check database
    const tokenDoc = await JWTToken.findByToken(token);

    if (!tokenDoc) {
      return res.status(401).json({ error: 'Token not found' });
    }

    // Step 3: Validate status
    if (!tokenDoc.isValid()) {
      return res.status(401).json({ error: 'Token invalid or expired' });
    }

    // Token is valid - attach user to request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
```

---

### **Example 3: Logout (Single Device)**

```typescript
app.post('/logout', async (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];

  // Find and revoke token
  const tokenDoc = await JWTToken.findByToken(token);

  if (tokenDoc) {
    await tokenDoc.revoke();
    res.json({ message: 'Logged out successfully' });
  } else {
    res.status(404).json({ error: 'Token not found' });
  }
});
```

---

### **Example 4: Logout from All Devices**

```typescript
app.post('/logout-all', async (req, res) => {
  const userId = req.userId; // From auth middleware

  // Revoke all user tokens
  const result = await JWTToken.revokeAllUserTokens(userId);

  res.json({
    message: 'Logged out from all devices',
    tokensRevoked: result.modifiedCount
  });
});
```

---

### **Example 5: View Active Sessions**

```typescript
app.get('/sessions', async (req, res) => {
  const userId = req.userId;

  // Get all active tokens
  const activeSessions = await JWTToken.findActiveTokensByUserId(userId);

  const sessions = activeSessions.map(token => ({
    createdAt: token.createdAt,
    expiresAt: token.expiresAt,
    expiresIn: Math.ceil((token.expiresAt - new Date()) / (1000 * 60 * 60)), // hours
  }));

  res.json({ sessions });
});
```

---

### **Example 6: Cleanup Expired Tokens (Maintenance)**

```typescript
// Run this as a cron job (e.g., daily at 2 AM)
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  console.log('Running token cleanup...');
  
  const result = await JWTToken.cleanupExpiredTokens();
  
  console.log(`Cleaned up ${result.deletedCount} expired tokens`);
});
```

---

## 🔗 Relationships

### **Relationship with User Model:**

```
User (1) ────────────── (Many) JWTToken
     │                          │
     └── ownerUserId ───────────┘
```

**Query Examples:**
```typescript
// Get user's tokens
const user = await User.findByUserId('user-123');
const tokens = await JWTToken.findByUserId(user.userId);

// Populate user info in token query
const token = await JWTToken.findByToken('eyJhbGc...')
  .populate('ownerUserId'); // Gets full user object
```

---

## 🛡️ Best Practices

### **DO:**
- ✅ Always validate both JWT signature AND database status
- ✅ Revoke tokens on password change
- ✅ Clean up expired tokens regularly
- ✅ Use compound indexes for user-specific queries
- ✅ Hide token string from API responses
- ✅ Set reasonable expiration times (7-30 days)

### **DON'T:**
- ❌ Store tokens without expiration
- ❌ Expose token strings in responses
- ❌ Allow infinite active sessions per user
- ❌ Skip database validation (defeats purpose)
- ❌ Let expired tokens accumulate
- ❌ Use predictable tokenIds

---

## 🎓 Summary

**The JWTToken Model is:**
- 🔐 The session management system
- 🚪 The logout implementation mechanism
- 🛡️ The security control layer
- 📊 The audit trail for authentication
- ⏰ The expiration enforcement system

**It provides:**
- Token storage and validation
- Logout functionality (single and all devices)
- Session tracking across devices
- Security through revocation
- Audit trails for compliance
- Automatic expiration handling

**Essential for:**
- User authentication
- Session management
- Logout implementation
- Security control
- Multi-device support
- Compliance and auditing

---

*Last Updated: October 12, 2025*
