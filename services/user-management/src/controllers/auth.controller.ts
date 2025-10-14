import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, JWTToken } from '../models';

//Authentication Controller : Handles user signup, login, and logout operations
// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';
const BCRYPT_ROUNDS = 10;

//Helper: Calculate token expiration date
function calculateExpirationDate(expirationString: string): Date {
  const expiresAt = new Date();
  
  // Parse expiration string (e.g., "7d", "24h", "30m")
  const value = parseInt(expirationString);
  const unit = expirationString.slice(-1);
  
  switch (unit) {
    case 'd': // days
      expiresAt.setDate(expiresAt.getDate() + value);
      break;
    case 'h': // hours
      expiresAt.setHours(expiresAt.getHours() + value);
      break;
    case 'm': // minutes
      expiresAt.setMinutes(expiresAt.getMinutes() + value);
      break;
    default:
      // Default to 7 days
      expiresAt.setDate(expiresAt.getDate() + 7);
  }
  
  return expiresAt;
}

/**
 * Register Section - Create a new user
 * POST /api/auth/signup
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { userName, email, password } = req.body;

    // Validation: Check required fields
    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Username, email, and password are required',
        },
      });
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address',
        },
      });
    }

    // Validation: Username length
    if (userName.length < 3 || userName.length > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USERNAME',
          message: 'Username must be between 3 and 50 characters',
        },
      });
    }

    // Validation: Password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long',
        },
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists',
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create new user
    const newUser = new User({
      userName: userName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    // Save to database (this creates the "users" collection)
    await newUser.save();

    console.log('[Auth] New user registered:', newUser.email);

    // Return success response (WITHOUT password hash)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          userId: newUser.userId,
          userName: newUser.userName,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SIGNUP_FAILED',
        message: 'Failed to register user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

/**
 * LOGIN Section - Authenticate user and generate JWT token
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation: Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required',
        },
      });
    }

    // Find user by email (explicitly select passwordHash)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.userId,
      email: user.email,
    };

    const tokenString = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    } as jwt.SignOptions);

    // Calculate expiration date
    const expiresAt = calculateExpirationDate(JWT_EXPIRATION);

    // Store token in database (this creates the "jwttokens" collection)
    const jwtToken = new JWTToken({
      ownerUserId: user.userId,
      token: tokenString,
      expiresAt,
    });

    await jwtToken.save();

    console.log('[Auth] User logged in:', user.email);

    // Return success response with token
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: tokenString,
        expiresIn: JWT_EXPIRATION,
        expiresAt: expiresAt.toISOString(),
        user: {
          userId: user.userId,
          userName: user.userName,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to log in',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

/**
 * LOGOUT - Revoke JWT token
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    // Find token in database
    const jwtToken = await JWTToken.findOne({ token });

    if (!jwtToken) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TOKEN_NOT_FOUND',
          message: 'Token not found',
        },
      });
    }

    // Check if already revoked
    if (jwtToken.isRevoked) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_LOGGED_OUT',
          message: 'You are already logged out',
        },
      });
    }

    // Revoke token
    await jwtToken.revoke();

    console.log('[Auth] User logged out:', jwtToken.ownerUserId);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Failed to log out',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

/**
 * LOGOUT ALL - Revoke all user's tokens (logout from all devices)
 * POST /api/auth/logout-all
 */
export const logoutAll = async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token to get userId
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      });
    }

    // Revoke all tokens for this user
    const result = await JWTToken.updateMany(
      { ownerUserId: decoded.userId, isRevoked: false },
      { $set: { isRevoked: true } }
    );

    console.log('[Auth] User logged out from all devices:', decoded.userId);

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
      data: {
        tokensRevoked: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('[Auth] Logout all error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ALL_FAILED',
        message: 'Failed to log out from all devices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

/**
 * VERIFY TOKEN - Check if token is valid
 * GET /api/auth/verify
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT signature
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }

    // Check token in database
    const jwtToken = await JWTToken.findOne({ token });

    if (!jwtToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_NOT_FOUND',
          message: 'Token not found in database',
        },
      });
    }

    // Check if token is valid (not expired and not revoked)
    if (!jwtToken.isValid()) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: jwtToken.isExpired() ? 'Token has expired' : 'Token has been revoked',
        },
      });
    }

    // Token is valid - return user info
    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          userId: user.userId,
          userName: user.userName,
          email: user.email,
        },
        tokenExpiresAt: jwtToken.expiresAt,
      },
    });
  } catch (error) {
    console.error('[Auth] Verify token error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_FAILED',
        message: 'Failed to verify token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};
