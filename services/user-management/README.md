# User Management Service

## 📋 Overview

The User Management Service handles all authentication and user account management for the DNA Encoder application.

## 🚀 Features

- User registration (sign up)
- User authentication (login/logout)
- JWT token generation and validation
- API key management
- User profile management

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens) + bcrypt
- **Development**: Nodemon for hot-reload

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Update the MongoDB connection string if needed

3. **Make sure MongoDB is running:**
   ```bash
   # Check if MongoDB is running
   # Open MongoDB Compass and connect to localhost:27017
   # Or start MongoDB service:
   mongod
   ```

## 🔧 Configuration

### Environment Variables (`.env`)

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/dna-encoder

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# CORS
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:8100
```

## 🏃 Running the Service

### Development Mode (with hot-reload)
```bash
npm run dev
```

### Production Build
```bash
# Build TypeScript to JavaScript
npm run build

# Run production server
npm start
```

## 🧪 Testing the MongoDB Connection

Once you start the service with `npm run dev`, you should see:

```
✅ MongoDB connected successfully
📊 Database: dna-encoder
🌍 Environment: development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧬 DNA Encoder - User Management Service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server running on port 3001
🔗 Health check: http://localhost:3001/health
📡 API endpoint: http://localhost:3001/api
🌍 Environment: development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Ready to accept requests!
```

### Test Health Check Endpoint

Open your browser or use curl:

```bash
# Browser
http://localhost:3001/health

# Or use curl
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User Management Service is running",
  "service": "user-management",
  "version": "1.0.0",
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

## 📡 API Endpoints

### Health Check
- **GET** `/health` - Check if service is running

### API Info
- **GET** `/api` - Get API information and available endpoints

### Authentication (Coming Soon)
- **POST** `/api/auth/signup` - Register new user
- **POST** `/api/auth/login` - Authenticate user
- **POST** `/api/auth/logout` - Logout user
- **GET** `/api/auth/verify` - Verify JWT token

### Users (Coming Soon)
- **GET** `/api/users/profile` - Get user profile
- **PUT** `/api/users/profile` - Update user profile
- **POST** `/api/users/api-keys` - Generate API key

## 🗂️ Project Structure

```
user-management/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config/
│   │   └── database.ts       # MongoDB connection
│   ├── models/               # Mongoose schemas (coming next)
│   │   ├── User.ts
│   │   └── JWTToken.ts
│   ├── controllers/          # Business logic (coming next)
│   │   └── authController.ts
│   ├── middleware/           # Express middleware (coming next)
│   │   ├── auth.ts
│   │   └── apiKey.ts
│   └── routes/               # API routes (coming next)
│       └── authRoutes.ts
├── dist/                     # Compiled JavaScript (generated)
├── node_modules/             # Dependencies
├── .env                      # Environment variables
├── .env.example              # Environment template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── nodemon.json              # Nodemon configuration
└── README.md                 # This file
```

## 🐛 Troubleshooting

### MongoDB Connection Failed

**Error:**
```
❌ MongoDB connection failed: MongoServerSelectionError
```

**Solutions:**
1. **Check if MongoDB is running:**
   - Open MongoDB Compass
   - Try connecting to `mongodb://localhost:27017`
   - Or run `mongod` in terminal

2. **Check MongoDB URI in `.env`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/dna-encoder
   ```

3. **Windows**: Make sure MongoDB service is started:
   - Open Services (`services.msc`)
   - Find "MongoDB" service
   - Click "Start"

### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change PORT in .env file
PORT=3002
```

### TypeScript Errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild TypeScript
npm run build
```

## 📚 Next Steps

1. ✅ MongoDB connection setup (DONE)
2. ⏳ Create Mongoose schemas (User, JWTToken)
3. ⏳ Implement authentication controllers
4. ⏳ Add authentication middleware
5. ⏳ Create API routes
6. ⏳ Add input validation
7. ⏳ Implement error handling
8. ⏳ Add unit tests

## 🔗 Related Services

- **Codec Service** (Port 3002) - DNA encoding/decoding
- **Object Storage Service** (Port 3003) - File management
- **Web App** (Port 4000) - Browser interface
- **Mobile App** - iOS/Android interface

## 📄 License

MIT License - DNA Encoder Team 2025
