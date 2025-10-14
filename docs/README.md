# DNA Encoder Documentation

Welcome to the DNA Encoder project documentation!

## 📚 Documentation Structure

### 🔐 User Management Service
**Location:** [`/docs/user-management/`](./user-management/)

Complete documentation for the authentication and user account management system.

**Files:**
- [Auth Controller Documentation](./user-management/auth-controller-documentation.md) - Signup, login, logout, verify functions
- [Auth Routes Documentation](./user-management/auth-routes-documentation.md) - API endpoints for authentication
- [Authentication Testing Guide](./user-management/authentication-testing-guide.md) - How to test with Postman/cURL
- [User Model Documentation](./user-management/user-model-documentation.md) - User database schema
- [JWT Token Model Documentation](./user-management/jwttoken-model-documentation.md) - Token management schema
- [Middleware Documentation](./user-management/middleware-documentation.md) - Complete middleware guide
- [Middleware Quick Reference](./user-management/middleware-quick-reference.md) - Cheat sheet
- [Understanding Ownership and Errors](./user-management/understanding-ownership-and-errors.md) - Beginner-friendly guide
- [Index.ts Documentation](./user-management/index-ts-documentation.md) - Server setup guide
- [MongoDB Connection Setup](./user-management/mongodb-connection-setup.md) - Database configuration

---

### 📦 Object Storage Service
**Location:** [`/docs/object-storage/`](./object-storage/)

Documentation for file upload, storage, and management system.

**Files:**
- [File Model Documentation](./object-storage/file-model-documentation.md) - File database schema and usage
- [Storage Utilities Documentation](./object-storage/storage-utilities-documentation.md) - Filesystem operations guide
- [Upload Middleware Documentation](./object-storage/upload-middleware-documentation.md) - Multer configuration and file upload handling
- [Auth Middleware Documentation](./object-storage/auth-middleware-documentation.md) - Authentication and file ownership verification

**Status:** 🚧 In Development

---

### 🧬 Codec Service
**Location:** `/docs/codec-service/` (Coming Soon)

Documentation for DNA encoding/decoding operations.

**Status:** 📅 Planned

---

## 🗺️ Quick Navigation

### Getting Started
1. Start with [Project Structure](./project-structure.md)
2. Set up [MongoDB Connection](./user-management/mongodb-connection-setup.md)
3. Review [User Management](./user-management/) for authentication
4. Explore [Object Storage](./object-storage/) for file handling

### For Developers
- **API Testing:** [Authentication Testing Guide](./user-management/authentication-testing-guide.md)
- **Middleware:** [Quick Reference](./user-management/middleware-quick-reference.md)
- **Database Models:** User, JWTToken, File schemas

### For Beginners
- **Understanding Concepts:** [Ownership and Errors](./user-management/understanding-ownership-and-errors.md)
- **Step-by-Step:** Authentication testing guides

---

## 📊 Service Overview

| Service | Port | Status | Documentation |
|---------|------|--------|---------------|
| User Management | 3001 | ✅ Complete | [View Docs](./user-management/) |
| Object Storage | 3002 | 🚧 In Progress | [View Docs](./object-storage/) |
| Codec Service | 3003 | 📅 Planned | Coming Soon |
| Web Frontend | TBD | 📅 Planned | Coming Soon |
| Mobile App | TBD | 📅 Planned | Coming Soon |

---

## 🔍 Search by Topic

### Authentication & Security
- JWT token generation and verification
- Password hashing with bcrypt
- Token revocation (logout)
- Authentication middleware
- Ownership verification

### File Management
- File upload and storage
- File metadata tracking
- File download and deletion
- User file listings
- Storage location management

### DNA Encoding (Coming Soon)
- Binary to quaternary encoding
- Error correction methods (Fountain, Reed-Solomon, HEDGES)
- Sequence storage and retrieval
- Encoding/decoding pipeline

---

## 📝 Documentation Standards

All documentation follows these principles:
- **Beginner-Friendly:** Explains concepts from the ground up
- **Code Examples:** Real working examples included
- **Best Practices:** Do's and don'ts highlighted
- **Complete Coverage:** Every function, route, and model documented

---

## 🤝 Contributing

When adding new documentation:
1. Place in appropriate service folder
2. Follow existing format (Table of Contents, Examples, etc.)
3. Update this README with links
4. Include code examples and explanations

---

## 📞 Need Help?

If you can't find what you're looking for:
1. Check the specific service folder
2. Review the quick reference guides
3. Look at code examples in documentation
4. Refer to beginner-friendly guides

---

*Last Updated: October 13, 2025*  
*DNA Encoder Project Documentation*
