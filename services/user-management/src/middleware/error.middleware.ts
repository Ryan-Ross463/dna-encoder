import { Request, Response, NextFunction } from 'express';

/**
 * GLOBAL ERROR HANDLER
 * Catches all errors and sends appropriate responses
 * Must be defined AFTER all routes
 * Usage in index.ts:
 * app.use(errorHandler);
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details: string | undefined;

  // Include details in development mode
  if (process.env.NODE_ENV === 'development') {
    details = err.stack;
  }

  // Log error
  console.error('[Error Handler]', {
    code: errorCode,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details,
      path: req.path,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * NOT FOUND HANDLER
 * Handles 404 errors for undefined routes
 * 
 * Usage in index.ts (before errorHandler):
 * app.use(notFoundHandler);
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.path,
      method: req.method,
      hint: 'Check the API documentation for available endpoints',
    },
  });
};
