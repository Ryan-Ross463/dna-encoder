# User Model Documentation

## 📋 Overview

The **User Model** is the core data structure for user accounts in the DNA Encoder User Management Service. It represents registered users, stores their authentication credentials, manages API keys, and provides methods for user-related operations.

**Location:** `services/user-management/src/models/User.ts`

**Collection Name:** `users` (MongoDB collection)

---

## 🎯 Purpose & Role

### **Primary Purpose:**
The User Model serves as the **foundation of the authentication and authorization system**. It stores all user-related information and provides the data structure needed for:

1. **User Registration** - Creating new user accounts
2. **User Authentication** - Verifying user identity during login
3. **API Key Management** - Generating and managing service access keys
4. **User Profile Management** - Storing and updating user information
5. **Access Control** - Determining what resources users can access

---

### **Role in the System:**

```
┌─────────────────────────────────────────────────┐
│              User Model's Role                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Identity Storage                            │
│     └─ Stores unique user identifiers (userId) │
│                                                 │
│  2. Authentication                              │
│     └─ Stores hashed passwords securely        │
│                                                 │
│  3. Profile Management                          │
│     └─ Stores user information (name, email)   │
│                                                 │
│  4. API Key Generation                          │
│     └─ Creates and manages service access keys │
│                                                 │
│  5. Data Validation                             │
│     └─ Ensures data integrity and format       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📊 Data Structure

### **Schema Definition:**

```typescript
{
  userId: string,          // Unique identifier (UUID v4)
  userName: string,        // Display name (3-50 characters)
  email: string,           // Login credential (unique, validated)
  passwordHash: string,    // Hashed password (bcrypt, hidden)
  apiKeys: string[],       // Array of API keys (hidden)
  createdAt: Date,         // Account creation timestamp
  updatedAt: Date          // Last modification timestamp
}
```

---

### **Field Descriptions:**

#### **1. userId (String)**
```typescript
userId: {
  type: String,
  required: true,
  unique: true,
  default: () => uuidv4(),
  index: true
}
```

**Purpose:** Unique identifier for each user

**Characteristics:**
- ✅ Automatically generated using UUID v4
- ✅ Guaranteed to be unique across all users
- ✅ Indexed for fast lookups
- ✅ Used as primary identifier in relationships

**Example:** `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`

**Why UUID instead of MongoDB _id?**
- Platform-independent (can use across different databases)
- URL-safe (no special characters)
- Predictable format (always 36 characters)
- No information leakage (unlike sequential IDs)

---

#### **2. userName (String)**
```typescript
userName: {
  type: String,
  required: true,
  trim: true,
  minlength: 3,
  maxlength: 50
}
```

**Purpose:** User's display name (shown in UI, profiles)

**Characteristics:**
- ✅ Required field (cannot be empty)
- ✅ Minimum 3 characters
- ✅ Maximum 50 characters
- ✅ Automatically trims whitespace
- ✅ Can contain spaces and special characters

**Example:** `"Dr. Jane Smith"`, `"john_doe_123"`

**Validation Rules:**
- Must be between 3-50 characters
- Whitespace at start/end is removed
- Can be changed by user

---

#### **3. email (String)**
```typescript
email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  index: true,
  validate: {
    validator: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    message: 'Please provide a valid email address'
  }
}
```

**Purpose:** User's email address (used for login and communication)

**Characteristics:**
- ✅ Required and must be unique
- ✅ Automatically converted to lowercase
- ✅ Validated with regex pattern
- ✅ Indexed for fast lookups
- ✅ Primary login credential

**Example:** `"user@example.com"` (stored as lowercase)

**Email Validation:**
- Must match standard email format
- Automatically converts to lowercase (`John@Example.COM` → `john@example.com`)
- Cannot have duplicate emails in the system
- Used for password reset and notifications

---

#### **4. passwordHash (String)**
```typescript
passwordHash: {
  type: String,
  required: true,
  select: false  // Hidden by default in queries
}
```

**Purpose:** Securely stores user's hashed password

**Characteristics:**
- ✅ NEVER stores plain-text passwords
- ✅ Uses bcrypt hashing algorithm
- ✅ Hidden from query results by default
- ✅ Must be explicitly requested to retrieve

**Example:** `"$2b$10$KIXz4qJ9k.eYvH1pZJ8MxO5YxZnQ8jZ8wN7jD3xK8jL9pQ2mN4oZK"`

**Security Features:**
- Hashed with bcrypt (one-way encryption)
- Includes salt to prevent rainbow table attacks
- Not returned in API responses
- Cannot be reversed to get original password

**Important:** The actual password hashing is done in the authentication controller, not in the model itself.

---

#### **5. apiKeys (Array of Strings)**
```typescript
apiKeys: {
  type: [String],
  default: [],
  select: false  // Hidden by default in queries
}
```

**Purpose:** Stores API keys for programmatic access to services

**Characteristics:**
- ✅ Array of strings (multiple keys allowed)
- ✅ Hidden from query results by default
- ✅ Each key is a random 64-character hex string
- ✅ Used for service-to-service authentication

**Example:** `["abc123...xyz789", "def456...uvw012"]`

**Use Cases:**
- Frontend apps accessing backend APIs
- Third-party integrations
- Mobile apps authentication
- Service-to-service communication

**Security:**
- Each key is cryptographically random
- Not exposed in JSON responses
- Can be revoked individually
- Separate from JWT tokens

---

#### **6. createdAt (Date)**
```typescript
timestamps: true  // Auto-generates createdAt
```

**Purpose:** Records when the user account was created

**Characteristics:**
- ✅ Automatically set by Mongoose
- ✅ Cannot be modified after creation
- ✅ Used for auditing and analytics

**Example:** `2025-10-12T10:30:45.123Z`

**Use Cases:**
- Display "Member since" date
- Track user growth metrics
- Audit trails
- Compliance requirements

---

#### **7. updatedAt (Date)**
```typescript
timestamps: true  // Auto-generates updatedAt
```

**Purpose:** Records when the user document was last modified

**Characteristics:**
- ✅ Automatically updated by Mongoose on every save
- ✅ Tracks any field changes
- ✅ Used for cache invalidation

**Example:** `2025-10-12T15:45:20.789Z`

**Use Cases:**
- Track profile updates
- Cache management
- Audit trails
- Conflict resolution

---

## 🔧 Instance Methods

Instance methods are called on individual user documents.

### **1. generateApiKey()**

```typescript
user.generateApiKey(): string
```

**Purpose:** Generate a new API key for the user

**How it works:**
```typescript
const apiKey = crypto.randomBytes(32).toString('hex');
this.apiKeys.push(apiKey);
return apiKey;
```

**Example Usage:**
```typescript
const user = await User.findByEmail('user@example.com');
const newApiKey = user.generateApiKey();
await user.save();

console.log('Your new API key:', newApiKey);
// Output: "a1b2c3d4e5f6...xyz" (64 characters)
```

**Characteristics:**
- Generates 32 random bytes (64 hex characters)
- Adds key to user's apiKeys array
- Returns the key (this is the ONLY time it's visible)
- Must call `save()` to persist to database

**Security Note:** The key should be returned to the user ONCE and never shown again.

---

### **2. hasApiKey(apiKey)**

```typescript
user.hasApiKey(apiKey: string): boolean
```

**Purpose:** Check if user owns a specific API key

**Example Usage:**
```typescript
const user = await User.findOne({ email: 'user@example.com' })
  .select('+apiKeys'); // Must explicitly select apiKeys

if (user.hasApiKey(providedApiKey)) {
  console.log('Valid API key!');
} else {
  console.log('Invalid API key!');
}
```

**Use Cases:**
- Verify API key during authentication
- Check key ownership before operations
- Validate service requests

---

### **3. revokeApiKey(apiKey)**

```typescript
user.revokeApiKey(apiKey: string): Promise<IUser>
```

**Purpose:** Remove an API key from the user's collection

**Example Usage:**
```typescript
const user = await User.findOne({ userId: 'some-uuid' })
  .select('+apiKeys');

await user.revokeApiKey('key-to-revoke');
console.log('API key revoked successfully');
```

**How it works:**
- Filters out the specified key from apiKeys array
- Saves the document automatically
- Returns the updated user document

**Use Cases:**
- User revokes compromised key
- Admin removes access
- Key rotation/replacement

---

## 📡 Static Methods

Static methods are called on the model itself (not instances).

### **1. findByEmail(email)**

```typescript
User.findByEmail(email: string): Promise<IUser | null>
```

**Purpose:** Find a user by their email address

**Example Usage:**
```typescript
const user = await User.findByEmail('john@example.com');

if (user) {
  console.log('User found:', user.userName);
} else {
  console.log('User not found');
}
```

**Characteristics:**
- Automatically converts email to lowercase
- Returns null if not found
- Commonly used during login

---

### **2. findByUserId(userId)**

```typescript
User.findByUserId(userId: string): Promise<IUser | null>
```

**Purpose:** Find a user by their unique userId

**Example Usage:**
```typescript
const user = await User.findByUserId('a1b2c3d4-...');

if (user) {
  console.log('User found:', user.email);
}
```

**Use Cases:**
- Looking up user from JWT token payload
- User profile retrieval
- Authorization checks

---

## 🔒 Security Features

### **1. Password Hash Protection**

```typescript
select: false  // Hidden by default
```

**How it works:**
- Password hash is NEVER returned in queries unless explicitly requested
- Must use `.select('+passwordHash')` to retrieve

**Example:**
```typescript
// Normal query - NO password hash
const user = await User.findByEmail('user@example.com');
console.log(user.passwordHash);  // undefined

// Explicit selection - includes password hash
const userWithPassword = await User.findByEmail('user@example.com')
  .select('+passwordHash');
console.log(userWithPassword.passwordHash);  // "$2b$10$..."
```

---

### **2. API Keys Protection**

Same mechanism as password hash - hidden by default.

---

### **3. JSON Transformation**

```typescript
UserSchema.set('toJSON', {
  transform: function (_doc, ret) {
    return {
      userId: ret.userId,
      userName: ret.userName,
      email: ret.email,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
    };
  },
});
```

**Purpose:** Control what data is sent in API responses

**Example:**
```typescript
const user = await User.findByEmail('user@example.com');

// When sending as JSON
res.json(user);

// Client receives ONLY:
{
  "userId": "a1b2c3d4-...",
  "userName": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-10-12T...",
  "updatedAt": "2025-10-12T..."
}

// These are NEVER sent:
// - passwordHash (security)
// - apiKeys (security)
// - __v (internal MongoDB version field)
// - _id (we use userId instead)
```

---

## 🚀 Performance Optimization

### **Indexes:**

```typescript
UserSchema.index({ email: 1 });     // Single field index
UserSchema.index({ userId: 1 });    // Single field index
UserSchema.index({ createdAt: -1 }); // Sort by creation date
```

**Why indexes matter:**
- **Without index:** MongoDB scans ALL documents (slow)
- **With index:** MongoDB jumps directly to the document (fast)

**Example Performance:**
```
Finding user by email:
- Without index: 500ms (scan 100,000 users)
- With index: 5ms (direct lookup)
```

**Trade-offs:**
- ✅ Faster queries
- ❌ Slightly slower writes
- ❌ Uses more disk space

---

## 🔄 Lifecycle Hooks

### **Pre-save Hook:**

```typescript
UserSchema.pre('save', function (next) {
  if (!this.userId) {
    this.userId = uuidv4();
  }
  next();
});
```

**Purpose:** Ensure userId is generated before saving

**When it runs:** Before every `.save()` operation

**What it does:**
- Checks if userId exists
- If not, generates a new UUID
- Proceeds with save operation

---

## 📝 Usage Examples

### **Example 1: Create a New User**

```typescript
import User from './models/User';
import bcrypt from 'bcrypt';

// Hash the password
const passwordHash = await bcrypt.hash('userPassword123', 10);

// Create user
const newUser = new User({
  userName: 'John Doe',
  email: 'john@example.com',
  passwordHash: passwordHash,
});

// Save to database
await newUser.save();

console.log('User created:', newUser.userId);
```

---

### **Example 2: Login (Find and Verify Password)**

```typescript
import bcrypt from 'bcrypt';

// Find user by email
const user = await User.findByEmail('john@example.com')
  .select('+passwordHash'); // Must explicitly get password hash

if (!user) {
  throw new Error('User not found');
}

// Verify password
const isValid = await bcrypt.compare('providedPassword', user.passwordHash);

if (isValid) {
  console.log('Login successful!');
} else {
  console.log('Invalid password');
}
```

---

### **Example 3: Generate and Use API Key**

```typescript
// Find user
const user = await User.findByUserId('some-uuid')
  .select('+apiKeys');

// Generate new API key
const apiKey = user.generateApiKey();
await user.save();

// Return to user (ONLY TIME they see it)
console.log('Your API key:', apiKey);
console.log('Store this securely!');

// Later: Verify API key
const userToVerify = await User.findOne({ apiKeys: providedApiKey });

if (userToVerify) {
  console.log('Valid API key for:', userToVerify.email);
} else {
  console.log('Invalid API key');
}
```

---

### **Example 4: Update User Profile**

```typescript
const user = await User.findByEmail('john@example.com');

// Update fields
user.userName = 'John Smith';
await user.save();

// updatedAt is automatically updated
console.log('Profile updated:', user.updatedAt);
```

---

## 🔗 Relationships

### **Relationship with JWTToken Model:**

```
User (1) ────────────── (Many) JWTToken
     │                          │
     └── ownerUserId ───────────┘
```

**Description:**
- One user can have many JWT tokens
- Each token references a user via `ownerUserId`
- Used for session management across devices

---

## 🛡️ Best Practices

### **DO:**
- ✅ Always hash passwords before saving
- ✅ Use `.select('+passwordHash')` only when needed
- ✅ Validate email format before creating users
- ✅ Store API keys securely (never log them)
- ✅ Use `findByEmail()` for consistent lookups
- ✅ Generate strong, random API keys

### **DON'T:**
- ❌ Store plain-text passwords
- ❌ Return password hash in API responses
- ❌ Expose API keys publicly
- ❌ Allow duplicate emails
- ❌ Modify userId after creation
- ❌ Skip validation checks

---

## 🐛 Common Issues & Solutions

### **Issue 1: Email already exists**
```typescript
// Error: E11000 duplicate key error
```

**Solution:** Check if email exists before creating user
```typescript
const existing = await User.findByEmail(email);
if (existing) {
  throw new Error('Email already registered');
}
```

---

### **Issue 2: Password hash is undefined**
```typescript
console.log(user.passwordHash); // undefined
```

**Solution:** Explicitly select the field
```typescript
const user = await User.findByEmail(email).select('+passwordHash');
```

---

### **Issue 3: API keys not showing**
```typescript
console.log(user.apiKeys); // undefined
```

**Solution:** Same as password hash
```typescript
const user = await User.findById(id).select('+apiKeys');
```

---

## 📊 Database Collections

When you create a user, MongoDB will:
1. Create a `users` collection (if it doesn't exist)
2. Insert the document
3. Apply all indexes
4. Enforce all validations

**Collection structure in MongoDB Compass:**
```
users/
├── _id: ObjectId (MongoDB internal)
├── userId: "a1b2c3d4-..."
├── userName: "John Doe"
├── email: "john@example.com"
├── passwordHash: "$2b$10$..."
├── apiKeys: ["abc123...", "xyz789..."]
├── createdAt: ISODate(...)
└── updatedAt: ISODate(...)
```

---

## 🎓 Summary

**The User Model is:**
- 🔐 The foundation of authentication and authorization
- 📊 The primary data structure for user accounts
- 🔑 The manager of API keys and credentials
- 🛡️ A secure storage for sensitive information
- 🚀 Optimized for performance with indexes
- ✅ Validated to ensure data integrity

**It provides:**
- User registration and profile management
- Secure password storage
- API key generation and validation
- Email-based user lookups
- Automatic timestamp tracking
- Security through field hiding and JSON transformation

**Essential for:**
- Authentication flows (signup, login)
- Authorization decisions (who can access what)
- User profile operations (view, update)
- API key management (create, revoke)
- Audit trails (when account was created/modified)

---

*Last Updated: October 12, 2025*
