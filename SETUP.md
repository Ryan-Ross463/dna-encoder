# DNA Encoder - Setup Guide for Team

This project is a microservices-based DNA data storage application.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or remote)
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd "DNA Encoder"
```

### 2. Install Dependencies
```bash
# Install all services at once
npm run install:services

# Or install individually
cd services/user-management && npm install
cd services/object-storage && npm install
cd services/codec-service && npm install
```

### 3. Setup Environment Variables

Each service needs a `.env` file. Copy the example files and update with your settings:

#### User Management Service
```bash
cd services/user-management
cp .env.example .env
# Edit .env and update:
# - JWT_SECRET (use a strong random string)
# - MONGODB_URI (your MongoDB connection string)
```

#### Object Storage Service
```bash
cd services/object-storage
cp .env.example .env
# Edit .env and update:
# - JWT_SECRET (MUST match user-management!)
# - MONGODB_URI (same database as user-management)
```

#### Codec Service
```bash
cd services/codec-service
cp .env.example .env
# Edit .env and update:
# - JWT_SECRET (MUST match user-management!)
# - MONGODB_URI (same database)
# - OBJECT_STORAGE_URL (if different)
```

### 4. Start MongoDB
Make sure MongoDB is running:
```bash
# Windows
mongod

# Or use MongoDB Atlas (cloud)
```

### 5. Run Services

**Option A: Run all services together**
```bash
# From root directory
npm run dev:all
```

**Option B: Run individually (separate terminals)**
```bash
# Terminal 1 - User Management (Port 3001)
cd services/user-management
npm run dev

# Terminal 2 - Object Storage (Port 3002)
cd services/object-storage
npm run dev

# Terminal 3 - Codec Service (Port 3003)
cd services/codec-service
npm run dev
```

### 6. Test the Services

**Health Checks:**
- User Management: http://localhost:3001/health
- Object Storage: http://localhost:3002/health
- Codec Service: http://localhost:3003/health

## 📁 Project Structure

```
DNA Encoder/
├── services/
│   ├── user-management/     # Port 3001 - Authentication & users
│   ├── object-storage/      # Port 3002 - File storage
│   └── codec-service/       # Port 3003 - DNA encoding/decoding
├── frontend/
│   ├── web/                 # Web application
│   └── mobile/              # Mobile application
├── docs/                    # Documentation
└── package.json             # Root package scripts
```

## 🔧 Important Configuration Notes

### JWT Secret
**CRITICAL:** All three services MUST use the **same JWT_SECRET**!

```env
# All services need this EXACT same value
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### MongoDB Connection
All services should connect to the **same MongoDB database**:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/dna-encoder
```

### Ports
- User Management: 3001
- Object Storage: 3002
- Codec Service: 3003
- Frontend Web: 4000 (to be configured)
- Frontend Mobile: 8100 (to be configured)

## 🧪 Testing

### Run Tests
```bash
# User Management
cd services/user-management
npm test

# Codec Service - Mapping Tests
cd services/codec-service
npx ts-node src/services/mapping.test.ts
```

## 📚 Documentation

Detailed documentation is available in the `/docs` folder:

- **User Management**: `/docs/user-management/`
- **Object Storage**: `/docs/object-storage/`
- **Codec Service**: `/docs/codec-service/`

## 🤝 Team Collaboration

### First Time Setup
1. Each team member clones the repo
2. Copy `.env.example` to `.env` in each service
3. **Share the same JWT_SECRET** (use a secure method, not GitHub!)
4. Update MongoDB connection if using shared database

### Recommended: Shared Development Database
Option 1: Use MongoDB Atlas (free tier) and share the connection string
Option 2: One team member hosts MongoDB and shares IP + credentials

### DO NOT commit `.env` files!
The `.gitignore` file prevents this, but double-check before pushing.

## 🔒 Security Notes

**NEVER commit these files:**
- `.env` files (contains secrets)
- `node_modules/` (too large)
- `uploads/` (user data)
- `dist/` or `build/` (generated files)

**Always use `.env.example`** to share configuration structure.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows - Find and kill process
netstat -ano | findstr :3001
taskkill /PID <process-id> /F
```

### MongoDB Connection Error
- Check if MongoDB is running: `mongod`
- Verify connection string in `.env`
- Check firewall settings

### JWT Token Errors
- Ensure all services use the SAME JWT_SECRET
- Check token expiration (default: 7 days)

## 📞 Getting Help

- Check `/docs` folder for detailed documentation
- Review service-specific README files
- Ask team members in your project group

---

**Happy Coding! 🧬**
