import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

/**
 * GLOBAL ERROR HANDLER
 * Catches all errors and sends appropriate responses
 * Must be defined AFTER all routes
 * 
 * Handles specific error types:
 * - Multer file upload errors (size limit, file type, etc.)
 * - MongoDB validation errors
 * - JWT authentication errors
 * - General server errors
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details: string | undefined;

  // Handle Multer file upload errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File size exceeds the maximum allowed size of ${process.env.MAX_FILE_SIZE || '100MB'}`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name. Use "file" as the field name';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name is too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value is too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the multipart request';
        break;
      default:
        message = 'File upload error occurred';
    }
  }

  // Handle custom file validation errors
  if (err.code === 'INVALID_FILE_TYPE') {
    statusCode = 400;
    errorCode = 'INVALID_FILE_TYPE';
    message = err.message;
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    if (process.env.NODE_ENV === 'development') {
      details = Object.values(err.errors)
        .map((e: any) => e.message)
        .join(', ');
    }
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'A file with this identifier already exists';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development' && err.stack) {
    details = err.stack;
  }

  // Log error
  console.error('[Error Handler]', {
    code: errorCode,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    error: process.env.NODE_ENV === 'development' ? err : undefined,
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
      availableEndpoints: [
        'POST /api/files/upload',
        'GET /api/files',
        'GET /api/files/:fileId',
        'GET /api/files/:fileId/download',
        'DELETE /api/files/:fileId',
      ],
    },
  });
};
