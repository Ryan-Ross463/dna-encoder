import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database';
import { ensureUploadDir } from './utils/storage';
import fileRoutes from './routes/file.routes';
import { notFoundHandler, errorHandler } from './middleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Object Storage Service is running',
    service: 'object-storage',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API base route
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'DNA Encoder - Object Storage API',
    version: 'v1',
    endpoints: {
      health: '/health',
      files: '/api/files',
    },
  });
});

// Mount file routes
app.use('/api/files', fileRoutes);

// Handle 404 errors for undefined routes (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Ensure upload directory exists
    await ensureUploadDir();

    // Start listening
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log('================================================');
      console.log('  DNA Encoder - Object Storage Service');
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

// Start the server
startServer();

export default app;
