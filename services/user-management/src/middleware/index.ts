// This is the Central export point for all middleware in the user-management service folder.
// Authentication Middleware
export {
  authenticate,
  requireOwnership,
  AuthenticatedRequest,
} from './auth.middleware';

// Error handling middleware
export {
  errorHandler,
  notFoundHandler,
} from './error.middleware';
