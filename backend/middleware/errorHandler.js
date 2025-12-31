// middleware/errorHandler.js - Global error handler

import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS error',
      message: 'Origin not allowed'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message
    });
  }

  // JWT errors (if you add authentication later)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication error',
      message: 'Invalid token'
    });
  }

  // Axios errors (from AI API calls)
  if (err.isAxiosError) {
    return res.status(502).json({
      error: 'External API error',
      message: 'Failed to communicate with AI service'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.name || 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
};