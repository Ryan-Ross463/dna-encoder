import { Router } from 'express';
import {
  signup,
  login,
  logout,
  logoutAll,
  verifyToken,
} from '../controllers/auth.controller';

// Authentication Routes : Handles all authentication-related endpoint.
const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', signup);

/**
 * POST /api/auth/login
 * Authenticate user and receive JWT token
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 * Logout from current device (revoke current token)
 */
router.post('/logout', logout);

/**
 * POST /api/auth/logout-all
 * Logout from all devices (revoke all tokens)
 */
router.post('/logout-all', logoutAll);

/**
 * GET /api/auth/verify
 * Verify if token is valid
 */
router.get('/verify', verifyToken);
export default router;
