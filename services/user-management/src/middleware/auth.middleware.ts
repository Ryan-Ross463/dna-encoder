import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, JWTToken } from '../models';

//Authentication Middleware : Protects routes by verifying JWT tokens
// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Extended Request interface to include user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    userName: string;
  };
  token?: string;
}

/**
 * AUTHENTICATE MIDDLEWARE
 * Verifies JWT token and attaches user data to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
        },
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify JWT signature
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          hint: 'Please login again to get a new token',
        },
      });
      return;
    }

    // 3. Check token in database, if it exist on server side.
    const jwtToken = await JWTToken.findOne({ token });

    if (!jwtToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_NOT_FOUND',
          message: 'Token not found in database',
        },
      });
      return;
    }

    // 4. Check if token is valid (not revoked or expired)
    if (!jwtToken.isValid()) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: jwtToken.isExpired()
            ? 'Token has expired'
            : 'Token has been revoked',
          hint: 'Please login again',
        },
      });
      return;
    }

    // 5. Fetch user data
    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // 6. Attach user data to request object
    req.user = {
      userId: user.userId,
      email: user.email,
      userName: user.userName,
    };
    req.token = token;

    console.log('[Middleware] User authenticated:', user.email);

    // 7. Continue to next middleware/controller
    next();
  } catch (error) {
    console.error('[Middleware] Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_MIDDLEWARE_ERROR',
        message: 'Failed to authenticate request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

/**
 * OWNERSHIP MIDDLEWARE
 * Ensures authenticated users access only their own resources.
 * It prevents users from accessing or modifying other users' data or uploading files on their behalf.
 */
export const requireOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  try {
    const requestedUserId = req.params.userId;

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
          hint: 'This middleware requires authenticate middleware first',
        },
      });
      return;
    }

    if (req.user.userId !== requestedUserId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
          hint: 'You can only access your own data',
        },
      });
      return;
    }

    console.log('[Middleware] Ownership verified:', req.user.email);
    next();
  } catch (error) {
    console.error('[Middleware] Ownership check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'OWNERSHIP_CHECK_ERROR',
        message: 'Failed to verify ownership',
      },
    });
  }
};
