# index.ts - Express Server Documentation

## 📋 Overview

The `index.ts` file is the **main entry point** for the User Management Service. It initializes and configures the Express web server, sets up middleware, defines routes, and establishes the MongoDB database connection.

**Location:** `services/user-management/src/index.ts`

**Purpose:** 
- Start the Express HTTP server
- Connect to MongoDB database
- Define API endpoints
- Handle incoming HTTP requests
- Serve as the central hub for the User Management Service

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│          index.ts (Entry Point)             │
├─────────────────────────────────────────────┤
│                                             │
│  1. Load Environment Variables (.env)      │
│  2. Initialize Express Application          │
│  3. Configure Middleware (CORS, JSON)       │
│  4. Define Routes (/health, /api)           │
│  5. Set up 404 Error Handler                │
│  6. Connect to MongoDB                      │
│  7. Start Express Server on Port 3001       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📦 Dependencies & Imports

### **Core Dependencies**

```typescript
import express, { Application, Request, Response } from 'express';
```
- **express**: Web framework for building HTTP servers
- **Application**: TypeScript type for Express app instance
- **Request**: TypeScript type for HTTP request objects
- **Response**: TypeScript type for HTTP response objects

```typescript
import dotenv from 'dotenv';
```
- **dotenv**: Loads environment variables from `.env` file into `process.env`
- Allows secure configuration management (database URLs, ports, secrets)

```typescript
import cors from 'cors';
```
- **cors**: Cross-Origin Resource Sharing middleware
- Allows frontend applications from different domains to access this API
- Prevents browser security restrictions

```typescript
import { connectDB } from './config/database';
```
- **connectDB**: Custom function to establish MongoDB connection
- Defined in `src/config/database.ts`
- Handles connection errors and graceful shutdown

---

## ⚙️ Configuration & Initialization

### **1. Load Environment Variables**

```typescript
dotenv.config();
```

**What it does:**
- Reads the `.env` file in the service root directory
- Parses key-value pairs (e.g., `MONGODB_URI=mongodb://...`)
- Makes them available via `process.env.VARIABLE_NAME`

**Environment Variables Used:**
- `PORT`: Server port number (default: 3001)
- `NODE_ENV`: Environment type (development/production)
- `MONGODB_URI`: MongoDB connection string

---

### **2. Initialize Express Application**

```typescript
const app: Application = express();
const PORT = process.env.PORT || 3001;
```

**What it does:**
- Creates an Express application instance
- Sets the port to environment variable or defaults to 3001

**Type Safety:**
- `Application` type ensures TypeScript validates Express methods
- `PORT` can be a string or number (converted later)

---

## 🛡️ Middleware Configuration

Middleware functions execute **before** route handlers. They process incoming requests in order.

### **1. CORS Middleware**

```typescript
app.use(cors());
```

**Purpose:** Enable Cross-Origin Resource Sharing

**What it allows:**
- Frontend apps from different domains to make requests
- Browser to accept responses from this API

**Example:**
```
Frontend: http://localhost:3000 (React app)
    ↓ (makes request to)
Backend: http://localhost:3001 (Express API)
    ↓ (CORS allows this)
Response sent back to frontend ✅
```

---

### **2. JSON Body Parser**

```typescript
app.use(express.json());
```

**Purpose:** Parse incoming JSON request bodies

**What it does:**
- Reads JSON data from request body
- Converts it to JavaScript object
- Makes it available as `req.body`

**Example:**
```javascript
// Client sends:
POST /api/users
Content-Type: application/json
{ "name": "John", "email": "john@example.com" }

// Server receives (in route handler):
req.body = { name: "John", email: "john@example.com" }
```

---

### **3. URL-Encoded Parser**

```typescript
app.use(express.urlencoded({ extended: true }));
```

**Purpose:** Parse URL-encoded form data

**What it does:**
- Handles form submissions from HTML forms
- Parses data like `name=John&email=john@example.com`
- `extended: true` allows rich objects and arrays

**Example:**
```html
<!-- HTML Form -->
<form method="POST" action="/api/users">
  <input name="name" value="John">
  <input name="email" value="john@example.com">
  <button type="submit">Submit</button>
</form>

<!-- Server receives: -->
req.body = { name: "John", email: "john@example.com" }
```

---

## 🌐 API Routes & Endpoints

### **1. Health Check Endpoint**

```typescript
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'User Management Service is running',
    service: 'user-management',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
```

**Purpose:** Monitor service availability

**HTTP Method:** GET

**URL:** `http://localhost:3001/health`

**Response:**
```json
{
  "success": true,
  "message": "User Management Service is running",
  "service": "user-management",
  "version": "1.0.0",
  "timestamp": "2025-10-12T00:45:20.614Z"
}
```

**Use Cases:**
- Monitoring tools checking if service is alive
- Load balancers determining if server is healthy
- DevOps health checks in production

**Note:** `_req` prefix indicates parameter is intentionally unused (ESLint convention)

---

### **2. API Information Endpoint**

```typescript
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'DNA Encoder - User Management API',
    version: 'v1',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
    },
  });
});
```

**Purpose:** Provide API documentation and available endpoints

**HTTP Method:** GET

**URL:** `http://localhost:3001/api`

**Response:**
```json
{
  "success": true,
  "message": "DNA Encoder - User Management API",
  "version": "v1",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth",
    "users": "/api/users"
  }
}
```

**Use Cases:**
- Quick reference for available endpoints
- API discovery for frontend developers
- Documentation for API consumers

---

### **3. 404 Not Found Handler**

```typescript
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.path,
    },
  });
});
```

**Purpose:** Handle requests to non-existent routes

**Triggered when:** User requests a route that doesn't exist

**Example Request:**
```
GET http://localhost:3001/nonexistent
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Endpoint not found",
    "path": "/nonexistent"
  }
}
```

**Important:** This middleware must be defined **last** (after all routes) because Express matches routes in order.

---

## 🚀 Server Startup Function

### **startServer() - Async Function**

```typescript
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening - explicitly bind to 0.0.0.0 to accept connections from any interface
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log('================================================');
      console.log('  DNA Encoder - User Management Service');
      console.log('================================================');
      console.log(`Server:      http://localhost:${PORT}`);
      console.log(`Health:      http://localhost:${PORT}/health`);
      console.log(`API Info:    http://localhost:${PORT}/api`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('================================================');
      console.log('Status:      Ready to accept requests');
      console.log('');
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};
```

---

### **Step-by-Step Breakdown**

#### **Step 1: Connect to MongoDB**

```typescript
await connectDB();
```

**What happens:**
- Calls `connectDB()` function from `database.ts`
- Establishes connection to MongoDB using Mongoose
- Uses connection string from `.env` file
- Waits for connection to complete before proceeding (`await`)

**Console Output:**
```
[MongoDB] Connected successfully
[MongoDB] Database: dna-encoder
[MongoDB] Environment: development
```

**If connection fails:**
- Error is caught in the `catch` block
- Server exits with error message

---

#### **Step 2: Start Express Server**

```typescript
app.listen(Number(PORT), '0.0.0.0', () => {
  // Callback function
});
```

**Parameters:**
1. **`Number(PORT)`**: Convert port to number (3001)
2. **`'0.0.0.0'`**: Bind to all network interfaces
3. **Callback function**: Executes when server starts successfully

---

#### **Why `0.0.0.0`?**

| Bind Address | Meaning | Access |
|--------------|---------|--------|
| `'127.0.0.1'` | Localhost only | Only `http://localhost:3001` |
| `'0.0.0.0'` | All interfaces | `http://localhost:3001`, `http://127.0.0.1:3001`, `http://192.168.x.x:3001` |

**Benefits of `0.0.0.0`:**
- Accepts connections from localhost
- Accepts connections from local IP address
- More flexible for development
- Can test from other devices on your network

---

#### **Step 3: Success Callback**

```typescript
() => {
  console.log('================================================');
  console.log('  DNA Encoder - User Management Service');
  console.log('================================================');
  console.log(`Server:      http://localhost:${PORT}`);
  console.log(`Health:      http://localhost:${PORT}/health`);
  console.log(`API Info:    http://localhost:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('================================================');
  console.log('Status:      Ready to accept requests');
  console.log('');
}
```

**Purpose:** Print startup information to console

**When it runs:** Only after Express successfully binds to port 3001

**Console Output:**
```
================================================
  DNA Encoder - User Management Service
================================================
Server:      http://localhost:3001
Health:      http://localhost:3001/health
API Info:    http://localhost:3001/api
Environment: development
================================================
Status:      Ready to accept requests
```

---

#### **Step 4: Error Handling**

```typescript
catch (error) {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
}
```

**What it does:**
- Catches any errors during startup
- Prints error message to console
- Exits the process with code 1 (indicates failure)

**Example errors:**
- MongoDB connection failed
- Port 3001 already in use (`EADDRINUSE`)
- Network issues
- Missing environment variables

---

## 🔄 Execution Flow

### **Complete Startup Sequence**

```
1. npm run dev
   ↓
2. nodemon executes: ts-node src/index.ts
   ↓
3. TypeScript code compiles and runs
   ↓
4. dotenv.config() → Loads .env file
   ↓
5. const app = express() → Create Express app
   ↓
6. app.use(cors()) → Configure middleware
   ↓
7. app.use(express.json()) → Parse JSON bodies
   ↓
8. app.use(express.urlencoded()) → Parse form data
   ↓
9. app.get('/health') → Define health route
   ↓
10. app.get('/api') → Define API info route
    ↓
11. app.use((req, res) => 404) → Define 404 handler
    ↓
12. startServer() → Execute startup function
    ↓
13. await connectDB() → Connect to MongoDB
    ↓
    [MongoDB] Connected successfully
    ↓
14. app.listen(3001, '0.0.0.0', callback)
    ↓
15. Server starts listening on port 3001
    ↓
16. Callback prints startup message
    ↓
    ================================================
      DNA Encoder - User Management Service
    ================================================
    Server:      http://localhost:3001
    ...
    ↓
17. ✅ SERVER IS READY - Waiting for HTTP requests
```

---

## 🔌 Request/Response Flow

### **Example: Health Check Request**

```
1. Client sends request
   GET http://localhost:3001/health
   ↓
2. Request reaches Express server
   ↓
3. Express matches route: app.get('/health', ...)
   ↓
4. Route handler executes
   ↓
5. Handler creates JSON response
   {
     success: true,
     message: 'User Management Service is running',
     ...
   }
   ↓
6. res.status(200).json(...) sends response
   ↓
7. Client receives response
   HTTP 200 OK
   Content-Type: application/json
   { "success": true, ... }
```

---

## 📤 Export Statement

```typescript
export default app;
```

**Purpose:** Export Express app for testing and reuse

**Use cases:**
- **Testing:** Import app in test files without starting the server
- **Module reuse:** Use the app instance in other files
- **Separation of concerns:** Server startup logic separate from app configuration

**Example usage in tests:**
```typescript
import app from './index';
import request from 'supertest';

describe('Health Endpoint', () => {
  it('should return 200 status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
});
```

---

## 🎯 Key Concepts Explained

### **1. Async/Await**

```typescript
const startServer = async () => {
  await connectDB();  // Wait for MongoDB connection
  app.listen(...);    // Then start server
};
```

**Why async?**
- MongoDB connection takes time
- We must wait for connection before starting server
- `await` pauses execution until promise resolves

---

### **2. Middleware Order Matters**

```typescript
app.use(cors());           // 1st - Enable CORS
app.use(express.json());   // 2nd - Parse JSON
app.get('/health', ...);   // 3rd - Define routes
app.use((req, res) => 404); // LAST - 404 handler
```

**Rule:** Most specific routes first, catch-all routes last

---

### **3. Callback Functions**

```typescript
app.listen(PORT, HOST, () => {
  console.log('Server started!');
});
```

**Callback:** Function that runs **after** an operation completes

**When it runs:** After Express successfully starts listening

---

### **4. Error-First Pattern**

```typescript
try {
  await connectDB();  // Might fail
  app.listen(...);    // Might fail
} catch (error) {
  console.error(error);  // Handle any errors
  process.exit(1);       // Exit with failure code
}
```

**Pattern:** Wrap risky operations in try/catch blocks

---

## 🛠️ Common Modifications

### **Add a New Route**

```typescript
app.get('/api/status', (_req: Request, res: Response) => {
  res.status(200).json({
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});
```

---

### **Change Port**

Edit `.env` file:
```
PORT=4000
```

Or modify code:
```typescript
const PORT = process.env.PORT || 4000;
```

---

### **Add Request Logging**

```typescript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

---

## 🐛 Troubleshooting

### **Error: Port Already in Use**

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3001
```

**Solution:**
```powershell
# Find process using port 3001
Get-NetTCPConnection -LocalPort 3001 -State Listen

# Kill the process
taskkill /F /PID <process_id>
```

---

### **Error: MongoDB Connection Failed**

```
[MongoDB] Connection failed: MongoServerError
```

**Solutions:**
1. Check if MongoDB is running: `Get-Service MongoDB`
2. Verify connection string in `.env`
3. Check MongoDB logs

---

### **Error: Cannot Find Module**

```
Error: Cannot find module 'express'
```

**Solution:**
```powershell
npm install
```

---

## 📚 Related Files

| File | Purpose | Relationship |
|------|---------|--------------|
| `config/database.ts` | MongoDB connection | Called by `index.ts` via `connectDB()` |
| `.env` | Environment variables | Loaded by `dotenv.config()` |
| `package.json` | Dependencies & scripts | Defines `npm run dev` command |
| `nodemon.json` | Nodemon configuration | Controls auto-restart behavior |
| `tsconfig.json` | TypeScript settings | Compilation rules for TypeScript |

---

## 🎓 Learning Resources

### **Express.js**
- Official docs: https://expressjs.com/
- Routing guide: https://expressjs.com/en/guide/routing.html
- Middleware guide: https://expressjs.com/en/guide/using-middleware.html

### **TypeScript**
- Official docs: https://www.typescriptlang.org/
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html

### **Node.js**
- Official docs: https://nodejs.org/
- API reference: https://nodejs.org/api/

---

## ✅ Summary

**index.ts is the heart of the User Management Service:**

1. ✅ Loads environment configuration
2. ✅ Initializes Express web server
3. ✅ Configures middleware (CORS, JSON parsing)
4. ✅ Defines API routes
5. ✅ Connects to MongoDB database
6. ✅ Starts listening for HTTP requests on port 3001
7. ✅ Handles errors gracefully
8. ✅ Provides health check and API info endpoints

**Every HTTP request to your service flows through this file!**

---

*Last Updated: October 12, 2025*
