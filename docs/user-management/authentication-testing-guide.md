# Authentication System - Testing Guide

## ✅ **What We Just Built**

You now have a complete authentication system with:
- ✅ User signup (registration)
- ✅ User login (JWT token generation)
- ✅ User logout (token revocation)
- ✅ Logout from all devices
- ✅ Token verification
- ✅ Password hashing with bcrypt
- ✅ JWT token management

---

## 📁 **Files Created**

```
src/
├── controllers/
│   └── auth.controller.ts     ← Authentication logic
├── routes/
│   └── auth.routes.ts         ← API endpoints
└── index.ts                   ← Updated with routes
```

---

## 🚀 **How to Test**

### **Step 1: Start the Service**

```powershell
cd "C:\Projects\DNA Encoder\services\user-management"
npm run dev
```

**Expected output:**
```
[MongoDB] Connected successfully
[MongoDB] Database: dna-encoder
================================================
  DNA Encoder - User Management Service
================================================
Server:      http://localhost:3001
Status:      Ready to accept requests
```

---

### **Step 2: Test Signup (Register New User)**

**Command:**
```powershell
$body = @{
    userName = "John Doe"
    email = "john@example.com"
    password = "securePassword123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signup" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Select-Object StatusCode, Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-10-12T..."
    }
  }
}
```

**✅ AT THIS MOMENT: "users" collection created in MongoDB!**

---

### **Step 3: Check MongoDB Compass**

1. Open MongoDB Compass
2. Refresh (F5)
3. Navigate to `dna-encoder` database
4. You should see: **`users`** collection with 1 document

Click on the collection to see:
```json
{
  "_id": ObjectId("..."),
  "userId": "a1b2c3d4-...",
  "userName": "John Doe",
  "email": "john@example.com",
  "passwordHash": "$2b$10$...",  // Hashed password
  "apiKeys": [],
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

### **Step 4: Test Login**

**Command:**
```powershell
$loginBody = @{
    email = "john@example.com"
    password = "securePassword123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d",
    "expiresAt": "2025-10-19T...",
    "user": {
      "userId": "a1b2c3d4-...",
      "userName": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**✅ AT THIS MOMENT: "jwttokens" collection created in MongoDB!**

**Save the token for next steps:**
```powershell
$token = ($response.Content | ConvertFrom-Json).data.token
```

---

### **Step 5: Check MongoDB Compass Again**

1. Refresh MongoDB Compass (F5)
2. Navigate to `dna-encoder` database
3. You should now see: **TWO collections**:
   - **`users`** (1 document)
   - **`jwttokens`** (1 document)

Click on `jwttokens` to see:
```json
{
  "_id": ObjectId("..."),
  "tokenId": "t1a2b3c4-...",
  "ownerUserId": "a1b2c3d4-...",  // References user
  "token": "eyJhbGciOi...",
  "expiresAt": ISODate("2025-10-19..."),
  "isRevoked": false,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

### **Step 6: Test Token Verification**

**Command:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/verify" -Method GET -Headers @{ "Authorization" = "Bearer $token" } -UseBasicParsing | Select-Object StatusCode, Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "userId": "a1b2c3d4-...",
      "userName": "John Doe",
      "email": "john@example.com"
    },
    "tokenExpiresAt": "2025-10-19T..."
  }
}
```

---

### **Step 7: Test Logout**

**Command:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/logout" -Method POST -Headers @{ "Authorization" = "Bearer $token" } -UseBasicParsing | Select-Object StatusCode, Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**In MongoDB Compass:**
- Refresh the `jwttokens` collection
- The token document now has: `"isRevoked": true`

---

### **Step 8: Try Using Token After Logout**

**Command:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/verify" -Method GET -Headers @{ "Authorization" = "Bearer $token" } -UseBasicParsing
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_INVALID",
    "message": "Token has been revoked"
  }
}
```

**✅ Logout works! Token is no longer valid.**

---

## 🎯 **Complete Test Workflow**

Here's a complete PowerShell script you can copy-paste:

```powershell
# 1. Signup
Write-Host "=== TESTING SIGNUP ===" -ForegroundColor Cyan
$signupBody = @{
    userName = "Jane Smith"
    email = "jane@example.com"
    password = "mySecurePass456"
} | ConvertTo-Json

$signupResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signup" -Method POST -Body $signupBody -ContentType "application/json" -UseBasicParsing
Write-Host "Signup Status:" $signupResponse.StatusCode
$signupResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

# 2. Login
Write-Host "=== TESTING LOGIN ===" -ForegroundColor Cyan
$loginBody = @{
    email = "jane@example.com"
    password = "mySecurePass456"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
Write-Host "Login Status:" $loginResponse.StatusCode
$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.data.token
Write-Host "Token received:" $token.Substring(0, 50) "..."
Write-Host ""

# 3. Verify Token
Write-Host "=== TESTING TOKEN VERIFICATION ===" -ForegroundColor Cyan
$verifyResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/verify" -Method GET -Headers @{ "Authorization" = "Bearer $token" } -UseBasicParsing
Write-Host "Verify Status:" $verifyResponse.StatusCode
$verifyResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

# 4. Logout
Write-Host "=== TESTING LOGOUT ===" -ForegroundColor Cyan
$logoutResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/logout" -Method POST -Headers @{ "Authorization" = "Bearer $token" } -UseBasicParsing
Write-Host "Logout Status:" $logoutResponse.StatusCode
$logoutResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

# 5. Try using token after logout
Write-Host "=== TESTING TOKEN AFTER LOGOUT ===" -ForegroundColor Cyan
try {
    $verifyAfterLogout = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/verify" -Method GET -Headers @{ "Authorization" = "Bearer $token" } -UseBasicParsing
} catch {
    Write-Host "Token rejected (expected):" -ForegroundColor Green
    $_.Exception.Response.StatusCode
}
```

---

## 📊 **Available Endpoints**

| Method | Endpoint | Description | Body | Headers |
|--------|----------|-------------|------|---------|
| POST | `/api/auth/signup` | Register new user | userName, email, password | None |
| POST | `/api/auth/login` | Login user | email, password | None |
| POST | `/api/auth/logout` | Logout (current device) | None | Authorization: Bearer {token} |
| POST | `/api/auth/logout-all` | Logout (all devices) | None | Authorization: Bearer {token} |
| GET | `/api/auth/verify` | Verify token validity | None | Authorization: Bearer {token} |

---

## 🔐 **Security Features Implemented**

- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **JWT Tokens**: Signed with secret key
- ✅ **Token Storage**: Database-backed for revocation
- ✅ **Email Validation**: Regex pattern validation
- ✅ **Password Strength**: Minimum 8 characters
- ✅ **Duplicate Prevention**: Email uniqueness check
- ✅ **Token Revocation**: Logout functionality
- ✅ **Multi-device Logout**: Revoke all tokens
- ✅ **Input Sanitization**: Trim and lowercase email
- ✅ **Error Handling**: Comprehensive error responses

---

## 🐛 **Common Errors & Solutions**

### **Error: Email already exists**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists"
  }
}
```
**Solution:** Use a different email or delete the existing user from MongoDB Compass.

---

### **Error: Invalid credentials**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```
**Solution:** Check that email and password are correct.

---

### **Error: Password too short**
```json
{
  "success": false,
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password must be at least 8 characters long"
  }
}
```
**Solution:** Use a password with 8+ characters.

---

## 🎓 **What Happens Behind the Scenes**

### **Signup Process:**
```
1. Receive userName, email, password
2. Validate inputs (format, length, required fields)
3. Check if email already exists
4. Hash password with bcrypt (10 rounds)
   Original: "securePassword123"
   Hashed: "$2b$10$KIXz4qJ9k.eYvH1pZJ8MxO..."
5. Create User document
6. Save to database → "users" collection created
7. Return user info (without password)
```

---

### **Login Process:**
```
1. Receive email, password
2. Find user by email
3. Compare provided password with stored hash
   bcrypt.compare("securePassword123", "$2b$10$KIXz...")
4. If valid:
   a. Generate JWT token
      Header.Payload.Signature
   b. Calculate expiration (7 days)
   c. Store token in database → "jwttokens" collection created
   d. Return token to client
5. If invalid: Return error
```

---

### **Logout Process:**
```
1. Receive token from Authorization header
2. Find token in database
3. Set isRevoked = true
4. Save to database
5. Token is now invalid
6. Any future requests with this token will be rejected
```

---

## ✅ **Success Checklist**

After testing, you should have:
- ✅ "users" collection in MongoDB with user documents
- ✅ "jwttokens" collection in MongoDB with token documents
- ✅ Ability to signup new users
- ✅ Ability to login and receive JWT token
- ✅ Ability to verify token validity
- ✅ Ability to logout and revoke tokens
- ✅ Password hashing working (see $2b$10$ in database)
- ✅ JWT tokens being generated and stored

---

## 🚀 **Next Steps**

Now that authentication is complete, you can:
1. **Add protected routes** (require authentication)
2. **Create user profile endpoints** (GET, PUT, DELETE user)
3. **Implement API key management** (generate, list, revoke)
4. **Add email verification** (send confirmation emails)
5. **Add password reset** (forgot password functionality)
6. **Create admin routes** (manage all users)
7. **Add rate limiting** (prevent abuse)
8. **Implement refresh tokens** (extend sessions)

---

*Last Updated: October 12, 2025*
