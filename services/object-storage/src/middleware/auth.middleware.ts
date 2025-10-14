import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import File from '../models/File';

/**
 * Authentication Middleware for Object Storage Service
 * Verifies JWT tokens and checks file ownership
 */

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        userId: string;
        username?: string;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  username?: string;
  iat?: number;
  exp?: number;
}

/**
 * AUTHENTICATE MIDDLEWARE
 * Verifies JWT token and attaches user data to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided. Please include Authorization header with Bearer token.',
      });
      return;
    }

    // 2. Extracts the token from the header. The header is expected to be in the format "Bearer <token>"
    const token = authHeader.substring(7);

    // 3. Get JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Auth] JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'Authentication service not properly configured',
      });
      return;
    }

    // 4. Verify JWT signature
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // 5. Attach user data to request
    req.userId = decoded.userId;
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    console.log(`[Auth] User authenticated: ${decoded.userId}`);

    // 6. Continue to next middleware/controller
    next();
  } catch (error: any) {
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid',
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.',
      });
      return;
    }

    console.error('[Auth] Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred during authentication',
    });
  }
};

/**
 * OWNERSHIP MIDDLEWARE
 * Checks if authenticated user has access to his own requested files. 
 * Must be used AFTER authenticate middlewar.
 */
export const requireOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Check if user is authenticated
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // 2. Get fileId from request params
    const { fileId } = req.params;

    if (!fileId) {
      res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'File ID is required',
      });
      return;
    }

    // 3. Find file in database
    const file = await File.findByFileId(fileId);

    if (!file) {
      res.status(404).json({
        success: false,
        error: 'File not found',
        message: `No file found with ID: ${fileId}`,
      });
      return;
    }

    // 4. Check ownership
    if (file.ownerUserId !== req.userId) {
      console.warn(
        `[Auth] User ${req.userId} attempted to access file ${fileId} owned by ${file.ownerUserId}`
      );
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this file',
      });
      return;
    }

    // 5. User owns the file, proceed
    console.log(`[Auth] Ownership verified: User ${req.userId} owns file ${fileId}`);
    next();
  } catch (error) {
    console.error('[Auth] Ownership verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Ownership verification failed',
      message: 'An error occurred while verifying file ownership',
    });
  }
};
