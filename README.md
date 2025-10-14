# DNA Encoder - Biological Data Storage Research Application

A mobile and web application demonstrating the encoding and decoding of digital data into DNA quaternary sequences (A, T, C, G) for research and educational purposes.

## 🧬 Project Overview

This project simulates DNA storage encoding/decoding processes to explore biological data storage as an alternative to traditional storage media (SSDs, HDDs). The application provides:

- **Binary to Quaternary Encoding**: Convert digital files into DNA sequences (A, T, C, G)
- **Quaternary to Binary Decoding**: Convert DNA sequences back to original files
- **Error Correction Methods**: Implement and evaluate Fountain Code, Reed-Solomon, and HEDGES
- **Biological Error Simulation**: Simulate real-world DNA synthesis/sequencing errors
- **Educational Platform**: For researchers, educators, and bioinformatics students

## 🎯 Research Objectives

1. **Error Correction Evaluation**: Test Fountain Code, Reed-Solomon, and HEDGES against simulated biological errors
2. **Biological Error Analysis**: Evaluate substitutions, insertions, deletions, strand dropouts, homopolymer errors, and CG content bias
3. **Biomolecular Medium Assessment**: Compare ssDNA, dsDNA, and triple helix DNA for cost, speed, and stability
4. **Data Density Optimization**: Identify encoding schemes that maximize storage density

## 🏗️ Architecture

Service-Oriented Architecture (SOA) with the following components:

```
DNA-Encoder/
├── services/
│   ├── user-management/    # Authentication, user accounts, API keys
│   ├── codec-service/       # Core encoding/decoding logic
│   ├── object-storage/      # File upload/download handling
│   └── shared/              # Shared types and utilities
├── frontend/
│   ├── web/                 # Astro + Vue web application
│   └── mobile/              # Ionic Vue mobile application
└── docs/                    # Documentation
```

### Service Details

| Service | Port | Purpose |
|---------|------|---------|
| **User Management** | 3001 | Handle authentication, JWT tokens, API keys |
| **Codec Service** | 3002 | Encode/decode binary ↔ DNA sequences |
| **Object Storage** | 3003 | Manage file uploads, downloads, deletion |
| **Web App** | 4000 | Browser-based user interface |
| **Mobile App** | - | iOS/Android native application |

## 🛠️ Technology Stack

### Backend Services
- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + API Keys
- **Hosting**: Railway (with private networking)

### Frontend
- **Web**: Astro + Vue + TypeScript + Caddy
- **Mobile**: Ionic Vue (fallback: Expo or Android Studio)
- **Communication**: HTTPS encrypted transmission

### Error Correction Algorithms
- **Fountain Code**: Erasure resilience and high density
- **Reed-Solomon Code**: Block-level protection against substitutions
- **HEDGES**: Insertion/deletion (indel) protection

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "DNA Encoder"
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

   Or install services individually:
   ```bash
   cd services/user-management
   npm install
   
   cd ../codec-service
   npm install
   
   cd ../object-storage
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env` files in each service folder:

   **services/user-management/.env**
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/dna-encoder
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRATION=7d
   NODE_ENV=development
   ```

   **services/codec-service/.env**
   ```env
   PORT=3002
   USER_MANAGEMENT_URL=http://localhost:3001
   NODE_ENV=development
   ```

   **services/object-storage/.env**
   ```env
   PORT=3003
   MONGODB_URI=mongodb://localhost:27017/dna-encoder
   USER_MANAGEMENT_URL=http://localhost:3001
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=104857600
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Compass to connect
   ```

5. **Run services in development mode**

   Open separate terminal windows for each service:

   ```bash
   # Terminal 1 - User Management
   npm run dev:user

   # Terminal 2 - Codec Service
   npm run dev:codec

   # Terminal 3 - Object Storage
   npm run dev:storage

   # Terminal 4 - Web App (after setup)
   npm run dev:web

   # Terminal 5 - Mobile App (after setup)
   npm run dev:mobile
   ```

## 📊 Features

### Core Functionality
- ✅ User registration and authentication
- ✅ Secure login with JWT tokens
- ✅ File upload and management
- ✅ Binary to DNA sequence encoding
- ✅ DNA sequence to binary decoding
- ✅ Error correction method selection
- ✅ Biological error simulation
- ✅ Results visualization
- ✅ Report generation with metrics

### Biological Errors Simulated
- **Substitutions**: Random base changes (A↔T, C↔G)
- **Insertions**: Extra bases added
- **Deletions**: Bases removed (causes frame shifts)
- **Strand Dropouts**: Complete loss of oligonucleotides
- **Homopolymer Errors**: Issues with repeated bases (AAA, TTT)
- **CG Content Bias**: Imbalanced GC ratios
- **Amplification Bias**: Uneven oligo amplification

## 📱 User Flow

1. **Sign Up** → Create account with email/password
2. **Login** → Authenticate and receive JWT token
3. **Dashboard** → View uploaded files and recent activity
4. **Upload File** → Select file to encode
5. **Configure Encoding** → Choose error correction method
6. **View Results** → See DNA sequences and metrics
7. **Download Report** → Get detailed analysis
8. **Decode** → Convert DNA sequences back to original file
9. **Visualize Sequences** → Interactive DNA sequence viewer

## 📚 API Documentation

### User Management Service (Port 3001)

#### POST /api/auth/signup
Register a new user
```json
{
  "userName": "researcher1",
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### POST /api/auth/login
Authenticate user
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Codec Service (Port 3002)

#### POST /api/encode
Encode file to DNA sequences
```json
{
  "fileId": "file-uuid",
  "method": "fountain" | "reed-solomon" | "hedges",
  "errorRate": 0.01
}
```

#### POST /api/decode
Decode DNA sequences to file
```json
{
  "sequenceId": "sequence-uuid",
  "method": "fountain" | "reed-solomon" | "hedges"
}
```

### Object Storage Service (Port 3003)

#### POST /api/files/upload
Upload file (multipart/form-data)

#### GET /api/files/:fileId
Download file

#### DELETE /api/files/:fileId
Delete file

## 🧪 Testing

```bash
# Run all tests
npm test

# Run service-specific tests
cd services/user-management && npm test
cd services/codec-service && npm test
cd services/object-storage && npm test
```

## 📦 Building for Production

```bash
# Build all services
npm run build:all

# Or build individually
cd services/user-management && npm run build
cd services/codec-service && npm run build
cd services/object-storage && npm run build
```

## 🚢 Deployment

### Railway Deployment

1. Create Railway project
2. Add services (user-management, codec-service, object-storage)
3. Configure environment variables
4. Enable Railway private networking
5. Deploy each service

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure production `MONGODB_URI`
- Set appropriate CORS origins

## 🤝 Contributing

This is a research project. Contributions welcome for:
- Additional error correction algorithms
- Enhanced biological error models
- Performance optimizations
- UI/UX improvements
- Documentation enhancements

## 📖 Research References

- **Erlich, Y., & Zielinski, D. (2017)**. DNA Fountain enables a robust and efficient storage architecture. *Science, 355*(6328), 950-954.
- **Wicker, S. B., & Bhargava, V. K. (1994)**. Reed-Solomon Codes and Their Applications. *IEEE Press*.
- **Press, W. H., et al. (2020)**. HEDGES error-correcting code for DNA storage corrects indels and allows sequence constraints. *PNAS, 117*(31), 18489-18496.

## 📄 License

MIT License - See LICENSE file for details

## 👥 Authors

DNA Encoder Research Team - 2025

## 🙏 Acknowledgments

Special thanks to:
- Bioinformatics research community
- Open-source contributors
- Educational institutions supporting this research

---

## ⚠️ Disclaimer

This is a **simulation and research tool** for educational purposes. No actual DNA synthesis or sequencing is performed. The application uses digital representations of DNA quaternary sequences (A, T, C, G) to demonstrate encoding/decoding concepts.

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact the development team
- Check documentation in `/docs` folder

---

**Made with 🧬 for advancing biological data storage research**
