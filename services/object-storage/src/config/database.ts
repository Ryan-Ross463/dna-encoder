import mongoose from 'mongoose'; // ODM (Object Data Modeling) library for MongoDB and Node.js
import dotenv from 'dotenv'; // Load environment variables from .env file

dotenv.config(); // Read .env file and load into process.env

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dna-encoder'; // MongoDB connection string
const NODE_ENV = process.env.NODE_ENV || 'development'; // Environment (development, production, etc.)

 //Connect to MongoDB database
export const connectDB = async (): Promise<void> => {
  try {
    // MongoDB connection options
    const options = {
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server before throwing an error
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    // Establish the connection
    await mongoose.connect(MONGODB_URI, options);

    console.log('[MongoDB] Object Storage connected successfully');
    console.log(`[MongoDB] Database: ${mongoose.connection.name}`);
    console.log(`[MongoDB] Environment: ${NODE_ENV}`);
    console.log(`[MongoDB] Collections: files`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('[MongoDB] Connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Object Storage disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Object Storage reconnected');
    });

  } catch (error) {
    console.error('[MongoDB] Object Storage connection failed:', error);
    console.error('[MongoDB] Make sure MongoDB is running on your system');
    console.error('[MongoDB] Check your MONGODB_URI in .env file');
    process.exit(1); // Exit if database connection fails
  }
};

 //Disconnect from MongoDB database
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Object Storage disconnected gracefully');
  } catch (error) {
    console.error('[MongoDB] Error disconnecting:', error);
    process.exit(1);
  }
};

 //Get MongoDB connection status
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

 //Get database connection instance
export const getConnection = (): mongoose.Connection => {
  return mongoose.connection;
};

  //Handle graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\n[System] Received SIGINT signal - shutting down Object Storage...');
  await disconnectDB();
  process.exit(0);
});

  //Handle graceful shutdown on SIGTERM (kill command)
 
process.on('SIGTERM', async () => {
  console.log('\n[System] Received SIGTERM signal - shutting down Object Storage...');
  await disconnectDB();
  process.exit(0);
});
