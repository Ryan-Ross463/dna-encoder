# DNA Encoder Project Structure Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Root Level Files](#root-level-files)
3. [Services Architecture](#services-architecture)
4. [Frontend Applications](#frontend-applications)
5. [Folder Structure Diagram](#folder-structure-diagram)
6. [File Naming Conventions](#file-naming-conventions)

---

## Overview

The DNA Encoder project follows a **Service-Oriented Architecture (SOA)** pattern organized as a monorepo. This structure enables:
- Independent service development and deployment
- Clear separation of concerns
- Scalability and maintainability
- Code reusability through shared modules

---

## Root Level Files

### `package.json`
**Purpose:** Root workspace configuration file
**Contains:**
- Project metadata (name, version, description)
- Workspace definitions pointing to services and frontend apps
- Global scripts for running, installing, and building all services
- Node.js version requirements

**Key Features:**
```json
"workspaces": ["services/*", "frontend/*"]
```
This enables npm to treat all subdirectories as linked packages in a monorepo setup.

---

### `.gitignore`
**Purpose:** Specifies which files Git should ignore
**Excludes:**
- `node_modules/` - Dependencies (auto-generated)
- `.env` files - Environment variables (contain secrets)
- `dist/` and `build/` - Build outputs
- IDE-specific files (`.vscode/`, `.idea/`)
- OS-specific files (`.DS_Store`, `Thumbs.db`)
- Logs and temporary files

**Why Important:**
- Prevents sensitive data (API keys, passwords) from being committed
- Reduces repository size
- Avoids conflicts from generated files

---

### `README.md`
**Purpose:** Main project documentation
**Contains:**
- Project overview and research objectives
- Technology stack details
- Installation and setup instructions
- API documentation
- User flow diagrams
- Contributing guidelines
- Research references

**Audience:** Developers, researchers, educators, and contributors

---

## Services Architecture

All backend services are located in the `services/` directory. Each service is an independent Node.js application with its own dependencies and configuration.

---

### 1. User Management Service

**Location:** `services/user-management/`

**Purpose:** Handle all user-related operations and authentication

**Responsibilities:**
- User registration (sign up)
- User authentication (login/logout)
- JWT token generation and validation
- API key generation for service access
- User profile management

**Technology Stack:**
- Express.js - Web framework
- MongoDB + Mongoose - Database
- bcrypt - Password hashing
- jsonwebtoken - JWT authentication

**Port:** 3001

**Folder Structure:**
```
user-management/
├── package.json          # Service-specific dependencies
├── tsconfig.json         # TypeScript configuration
├── .env                  # Environment variables
└── src/
    ├── index.ts          # Entry point (Express server)
    ├── config/
    │   └── database.ts   # MongoDB connection setup
    ├── models/
    │   ├── User.ts       # User schema (Mongoose model)
    │   └── JWTToken.ts   # JWT token schema
    ├── controllers/
    │   └── authController.ts  # Authentication logic
    ├── middleware/
    │   ├── auth.ts       # JWT verification middleware
    │   └── apiKey.ts     # API key validation
    └── routes/
        └── authRoutes.ts # API endpoints definition
```

**Key Files Explained:**

- **`index.ts`**: Main entry point that:
  - Initializes Express server
  - Connects to MongoDB
  - Registers middleware
  - Defines routes
  - Starts listening on port 3001

- **`config/database.ts`**: 
  - Establishes MongoDB connection
  - Handles connection errors
  - Exports connection function

- **`models/User.ts`**:
  - Defines User schema (userId, email, passwordHash, apiKeys)
  - Includes timestamps (createdAt, updatedAt)
  - Exports Mongoose model

- **`models/JWTToken.ts`**:
  - Defines JWT token schema
  - Tracks token expiration and revocation
  - Links tokens to users via ownerUserId

- **`controllers/authController.ts`**:
  - `signup()`: Creates new user, hashes password, generates API key
  - `login()`: Validates credentials, issues JWT token
  - `logout()`: Revokes JWT token
  - `verifyToken()`: Checks if token is valid

- **`middleware/auth.ts`**:
  - Verifies JWT token from request headers
  - Attaches user info to request object
  - Returns 401 if unauthorized

- **`middleware/apiKey.ts`**:
  - Validates API key from request headers
  - Used by other services to authenticate requests
  - Returns 403 if invalid

- **`routes/authRoutes.ts`**:
  - Defines HTTP endpoints:
    - POST `/api/auth/signup`
    - POST `/api/auth/login`
    - POST `/api/auth/logout`
    - GET `/api/auth/verify`

---

### 2. Codec Service

**Location:** `services/codec-service/`

**Purpose:** Core DNA encoding and decoding operations

**Responsibilities:**
- Convert binary data to DNA quaternary sequences (A, T, C, G)
- Convert DNA sequences back to binary data
- Apply error correction algorithms (Fountain Code, Reed-Solomon, HEDGES)
- Simulate biological errors (substitutions, insertions, deletions)
- Generate encoding/decoding reports with metrics

**Technology Stack:**
- Express.js - Web framework
- Custom algorithms for DNA conversion
- Error correction libraries

**Port:** 3002

**Folder Structure:**
```
codec-service/
├── package.json
├── tsconfig.json
├── .env
└── src/
    ├── index.ts              # Entry point
    ├── config/
    │   └── codecConfig.ts    # Encoding parameters
    ├── controllers/
    │   ├── encodeController.ts   # Handle encode requests
    │   └── decodeController.ts   # Handle decode requests
    └── utils/
        ├── binaryToDNA.ts        # Binary → ATCG conversion
        ├── dnaToBinary.ts        # ATCG → Binary conversion
        ├── fountainCode.ts       # Fountain code implementation
        ├── reedSolomon.ts        # Reed-Solomon implementation
        ├── hedges.ts             # HEDGES algorithm
        └── errorSimulation.ts    # Biological error simulator
```

**Key Files Explained:**

- **`config/codecConfig.ts`**:
  - Defines encoding parameters (chunk size, redundancy)
  - Error correction method settings
  - Biological error simulation rates

- **`controllers/encodeController.ts`**:
  - `encodeFile()`: Main encoding function
  - Retrieves file from Object Storage Service
  - Converts binary to DNA sequences
  - Applies selected error correction method
  - Stores sequences in database
  - Returns encoding metrics (time, size, density)

- **`controllers/decodeController.ts`**:
  - `decodeSequence()`: Main decoding function
  - Retrieves DNA sequences from database
  - Applies error correction decoding
  - Converts DNA back to binary
  - Verifies data integrity
  - Returns original file

- **`utils/binaryToDNA.ts`**:
  - Converts binary (0s and 1s) to quaternary (ATCG)
  - Common mapping: 00→A, 01→T, 10→C, 11→G
  - Handles byte-to-base conversion

- **`utils/dnaToBinary.ts`**:
  - Reverse of binaryToDNA
  - Converts ATCG back to 0s and 1s
  - Reconstructs original binary data

- **`utils/fountainCode.ts`**:
  - Implements Fountain Code algorithm
  - Breaks file into redundant "droplets"
  - Enables recovery even with oligo loss
  - High density and erasure resilience

- **`utils/reedSolomon.ts`**:
  - Implements Reed-Solomon error correction
  - Block-level protection against substitutions
  - Corrects limited number of errors per block

- **`utils/hedges.ts`**:
  - Implements HEDGES algorithm
  - Protects against insertions and deletions (indels)
  - Prevents frame shift errors

- **`utils/errorSimulation.ts`**:
  - Simulates biological errors:
    - **Substitutions**: Random base changes
    - **Insertions**: Extra bases added
    - **Deletions**: Bases removed
    - **Dropouts**: Complete oligo loss
    - **Homopolymer errors**: Repeated base issues
    - **CG bias**: Imbalanced GC content

---

### 3. Object Storage Service

**Location:** `services/object-storage/`

**Purpose:** Manage file storage, uploads, and downloads

**Responsibilities:**
- Handle file uploads (multipart/form-data)
- Store files locally or in cloud storage
- Provide file download functionality
- Delete files when requested
- Store file metadata in MongoDB
- Track file ownership and permissions

**Technology Stack:**
- Express.js - Web framework
- Multer - File upload middleware
- MongoDB + Mongoose - Metadata storage
- Node.js fs module - File system operations

**Port:** 3003

**Folder Structure:**
```
object-storage/
├── package.json
├── tsconfig.json
├── .env
└── src/
    ├── index.ts          # Entry point
    ├── config/
    │   └── storageConfig.ts  # Storage configuration
    ├── models/
    │   └── File.ts       # File metadata schema
    └── controllers/
        ├── uploadController.ts    # Handle uploads
        ├── downloadController.ts  # Handle downloads
        └── deleteController.ts    # Handle deletion
```

**Key Files Explained:**

- **`config/storageConfig.ts`**:
  - Defines upload directory path
  - Sets maximum file size limits
  - Configures allowed file types
  - Cloud storage credentials (if using S3)

- **`models/File.ts`**:
  - File metadata schema:
    - `fileId`: Unique identifier
    - `ownerUserId`: User who uploaded
    - `fileName`: Original file name
    - `fileSize`: Size in bytes
    - `url`: Storage location
    - `encodedSize`: Size after DNA encoding
    - `status`: uploaded/encoded/decoded/error
    - `createdAt`, `updatedAt`: Timestamps

- **`controllers/uploadController.ts`**:
  - `uploadFile()`: Handles file upload
  - Uses Multer middleware for multipart parsing
  - Validates file type and size
  - Saves file to storage directory
  - Creates database record with metadata
  - Returns fileId and URL

- **`controllers/downloadController.ts`**:
  - `downloadFile()`: Serves file for download
  - Verifies user ownership or permissions
  - Retrieves file from storage
  - Sets appropriate headers (Content-Type, Content-Disposition)
  - Streams file to client

- **`controllers/deleteController.ts`**:
  - `deleteFile()`: Removes file from storage
  - Verifies user ownership
  - Deletes file from file system
  - Removes database record
  - Returns confirmation

---

### 4. Shared Module

**Location:** `services/shared/`

**Purpose:** Provide reusable code across all services

**Responsibilities:**
- Define common TypeScript interfaces and types
- Provide utility functions used by multiple services
- Store shared constants and configuration
- Ensure consistency across services

**Folder Structure:**
```
shared/
├── package.json
├── tsconfig.json
├── types/
│   ├── user.types.ts    # User-related TypeScript interfaces
│   ├── file.types.ts    # File-related interfaces
│   └── api.types.ts     # API request/response types
└── utils/
    ├── logger.ts        # Logging utility
    ├── validation.ts    # Input validation helpers
    └── constants.ts     # Shared constants
```

**Key Files Explained:**

- **`types/user.types.ts`**:
  ```typescript
  export interface IUser {
    userId: string;
    userName: string;
    email: string;
    apiKeys: string[];
    createdAt: Date;
  }
  
  export interface IAuthRequest {
    email: string;
    password: string;
  }
  
  export interface IAuthResponse {
    token: string;
    user: IUser;
  }
  ```

- **`types/file.types.ts`**:
  ```typescript
  export interface IFile {
    fileId: string;
    ownerUserId: string;
    fileName: string;
    fileSize: number;
    url: string;
    status: 'uploaded' | 'encoded' | 'decoded' | 'error';
  }
  
  export interface IEncodeRequest {
    fileId: string;
    method: 'fountain' | 'reed-solomon' | 'hedges';
    errorRate?: number;
  }
  ```

- **`types/api.types.ts`**:
  ```typescript
  export interface IApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface IPaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
  }
  ```

- **`utils/logger.ts`**:
  - Provides consistent logging across services
  - Supports different log levels (info, warn, error, debug)
  - Formats log messages with timestamps
  - Can integrate with logging services (e.g., Winston, Pino)

- **`utils/validation.ts`**:
  - Email validation regex
  - Password strength checker
  - File type validation
  - Input sanitization functions
  - API key format validation

- **`utils/constants.ts`**:
  ```typescript
  export const ERROR_CODES = {
    UNAUTHORIZED: 'AUTH_001',
    INVALID_TOKEN: 'AUTH_002',
    FILE_NOT_FOUND: 'FILE_001',
    ENCODING_FAILED: 'CODEC_001',
  };
  
  export const DNA_BASES = ['A', 'T', 'C', 'G'];
  
  export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  ```

---

## Frontend Applications

Both frontend applications are located in the `frontend/` directory.

---

### 1. Web Application

**Location:** `frontend/web/`

**Purpose:** Browser-based user interface

**Technology:**
- Astro - Static site generator with server-side rendering
- Vue - Interactive components and reactivity
- TypeScript - Type safety
- Caddy - Reverse proxy for production

**Port:** 4000

**Folder Structure:**
```
web/
├── package.json
├── astro.config.mjs      # Astro configuration
├── tsconfig.json
├── src/
│   ├── pages/            # File-based routing
│   │   ├── index.astro       # Landing page (/)
│   │   ├── login.astro       # Login page (/login)
│   │   ├── signup.astro      # Signup page (/signup)
│   │   └── dashboard.astro   # Dashboard (/dashboard)
│   ├── components/       # Vue components
│   │   ├── LoginForm.vue
│   │   ├── FileUpload.vue
│   │   ├── FileList.vue
│   │   ├── EncodeForm.vue
│   │   ├── DecodeForm.vue
│   │   └── ResultsView.vue
│   ├── layouts/          # Page layouts
│   │   └── MainLayout.astro
│   ├── services/         # API communication
│   │   └── api.ts
│   └── styles/           # CSS files
│       └── global.css
└── public/               # Static assets
    ├── images/
    └── favicon.ico
```

**Key Concepts:**

- **Astro Pages** (`.astro` files):
  - File-based routing: `pages/login.astro` → `/login`
  - Server-side rendered by default
  - Can include Vue components
  - SEO-friendly

- **Vue Components** (`.vue` files):
  - Interactive UI elements
  - Client-side reactivity
  - Reusable across pages
  - Handle user input and events

- **API Service** (`services/api.ts`):
  - Centralized HTTP client (using fetch or axios)
  - Handles authentication headers
  - Communicates with backend services
  - Error handling and retries

---

### 2. Mobile Application

**Location:** `frontend/mobile/`

**Purpose:** Native iOS and Android application

**Technology:**
- Ionic Vue - Mobile UI framework
- Capacitor - Native runtime
- TypeScript - Type safety

**Folder Structure:**
```
mobile/
├── package.json
├── ionic.config.json     # Ionic configuration
├── capacitor.config.ts   # Capacitor (native) config
├── tsconfig.json
└── src/
    ├── App.vue           # Root component
    ├── main.ts           # Entry point
    ├── router/
    │   └── index.ts      # Route definitions
    ├── views/            # Page components
    │   ├── LoginPage.vue
    │   ├── SignUpPage.vue
    │   ├── DashboardPage.vue
    │   ├── FileDetailPage.vue
    │   └── ResultsPage.vue
    ├── components/       # Reusable components
    │   ├── FileCard.vue
    │   ├── SequenceVisualizer.vue
    │   └── UploadButton.vue
    ├── services/         # API and utilities
    │   ├── api.ts
    │   └── storage.ts    # Local storage helper
    └── assets/           # Images, icons
        └── logo.png
```

**Key Features:**

- **Native Capabilities**:
  - Camera access (for QR code scanning - future feature)
  - File system access
  - Push notifications (future)
  - Offline storage with Capacitor

- **Ionic UI Components**:
  - `<ion-button>`, `<ion-card>`, `<ion-list>`
  - Native-like appearance on iOS and Android
  - Touch gestures and animations

---

## Folder Structure Diagram

```
DNA Encoder/
│
├── 📄 package.json              # Root workspace config
├── 📄 .gitignore                # Git ignore rules
├── 📄 README.md                 # Main documentation
│
├── 📂 docs/                     # Documentation folder
│   ├── project-structure.md    # This file
│   ├── api-documentation.md    # API endpoints
│   ├── database-schema.md      # MongoDB schemas
│   └── deployment-guide.md     # Deployment instructions
│
├── 📂 services/                 # Backend services
│   │
│   ├── 📂 user-management/      # Authentication service
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config/
│   │       ├── models/
│   │       ├── controllers/
│   │       ├── middleware/
│   │       └── routes/
│   │
│   ├── 📂 codec-service/        # DNA encoding/decoding
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config/
│   │       ├── controllers/
│   │       └── utils/
│   │
│   ├── 📂 object-storage/       # File management
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config/
│   │       ├── models/
│   │       └── controllers/
│   │
│   └── 📂 shared/               # Shared code
│       ├── package.json
│       ├── tsconfig.json
│       ├── types/
│       └── utils/
│
└── 📂 frontend/                 # Frontend applications
    │
    ├── 📂 web/                  # Web application
    │   ├── package.json
    │   ├── astro.config.mjs
    │   ├── tsconfig.json
    │   ├── src/
    │   │   ├── pages/
    │   │   ├── components/
    │   │   ├── layouts/
    │   │   └── services/
    │   └── public/
    │
    └── 📂 mobile/               # Mobile application
        ├── package.json
        ├── ionic.config.json
        ├── capacitor.config.ts
        ├── tsconfig.json
        └── src/
            ├── App.vue
            ├── main.ts
            ├── router/
            ├── views/
            ├── components/
            └── services/
```

---

## File Naming Conventions

### TypeScript Files

| Type | Convention | Example |
|------|------------|---------|
| Models | PascalCase | `User.ts`, `JWTToken.ts` |
| Controllers | camelCase + Controller suffix | `authController.ts` |
| Routes | camelCase + Routes suffix | `authRoutes.ts` |
| Middleware | camelCase | `auth.ts`, `validation.ts` |
| Utils | camelCase | `logger.ts`, `binaryToDNA.ts` |
| Types | camelCase + .types suffix | `user.types.ts` |
| Config | camelCase + Config suffix | `database.ts`, `codecConfig.ts` |

### Vue Components

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FileUpload.vue`, `LoginForm.vue` |
| Pages | PascalCase + Page suffix | `DashboardPage.vue` |

### Astro Files

| Type | Convention | Example |
|------|------------|---------|
| Pages | lowercase | `index.astro`, `login.astro` |
| Layouts | PascalCase | `MainLayout.astro` |

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript compiler options |
| `.env` | Environment variables (never commit!) |
| `.gitignore` | Files to exclude from Git |
| `astro.config.mjs` | Astro framework configuration |
| `ionic.config.json` | Ionic framework configuration |
| `capacitor.config.ts` | Capacitor native configuration |

---

## Service Communication Flow

```
User (Mobile/Web)
        ↓
    [HTTPS]
        ↓
┌───────────────────┐
│ User Management   │ ← Authentication
│ Service (3001)    │
└───────────────────┘
        ↓ [API Key Validation]
        ↓
┌───────────────────┐         ┌───────────────────┐
│ Object Storage    │ ←─────→ │ Codec Service     │
│ Service (3003)    │         │ (3002)            │
└───────────────────┘         └───────────────────┘
        ↓                             ↓
   [File Data]              [DNA Sequences]
        ↓                             ↓
┌─────────────────────────────────────┐
│         MongoDB Database            │
│  - Users Collection                 │
│  - JWT Tokens Collection            │
│  - Files Collection                 │
└─────────────────────────────────────┘
```

**Flow Explanation:**

1. **User Login** → User Management Service authenticates → Issues JWT token
2. **File Upload** → Object Storage Service receives file → Stores in file system → Records metadata in MongoDB
3. **Encode Request** → Codec Service retrieves file from Object Storage → Encodes to DNA → Stores sequences in MongoDB
4. **Decode Request** → Codec Service retrieves sequences from MongoDB → Decodes to binary → Sends to Object Storage
5. **View Results** → Frontend requests data → Services return JSON → UI displays results

---

## Environment Variables

Each service requires its own `.env` file:

### User Management Service
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/dna-encoder
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
NODE_ENV=development
```

### Codec Service
```env
PORT=3002
USER_MANAGEMENT_URL=http://localhost:3001
NODE_ENV=development
```

### Object Storage Service
```env
PORT=3003
MONGODB_URI=mongodb://localhost:27017/dna-encoder
USER_MANAGEMENT_URL=http://localhost:3001
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
NODE_ENV=development
```

---

## Development Workflow

### Starting Development

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start MongoDB:**
   ```bash
   mongod
   ```

3. **Start services** (separate terminals):
   ```bash
   npm run dev:user
   npm run dev:codec
   npm run dev:storage
   npm run dev:web
   npm run dev:mobile
   ```

### Adding a New Feature

1. Determine which service it belongs to
2. Create necessary files (models, controllers, routes)
3. Update shared types if needed
4. Test locally
5. Commit changes

### Deploying

1. **Build all services:**
   ```bash
   npm run build:all
   ```

2. **Deploy to Railway:**
   - Each service gets its own Railway service
   - Configure environment variables
   - Enable Railway private networking
   - Deploy from `dist/` folder

---

## Best Practices

### Code Organization
- ✅ Keep related files together (models, controllers, routes)
- ✅ Use TypeScript for type safety
- ✅ Share common code through the `shared/` module
- ✅ Keep services stateless when possible (for horizontal scaling)

### Security
- ✅ Never commit `.env` files
- ✅ Always validate user input
- ✅ Use HTTPS in production
- ✅ Hash passwords with bcrypt
- ✅ Implement rate limiting on API endpoints

### Database
- ✅ Use Mongoose schemas for data validation
- ✅ Create indexes for frequently queried fields
- ✅ Use timestamps (`createdAt`, `updatedAt`)
- ✅ Implement soft deletes (mark as deleted instead of removing)

### Error Handling
- ✅ Use try-catch blocks in controllers
- ✅ Return consistent error responses
- ✅ Log errors for debugging
- ✅ Don't expose sensitive information in error messages

---

## Conclusion

This project structure is designed to be:
- **Scalable**: Services can be scaled independently
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new features or services
- **Professional**: Follows industry best practices

Each folder and file has a specific purpose, making it easy for new developers to understand and contribute to the project.

---

**Last Updated:** October 11, 2025  
**Version:** 1.0.0
