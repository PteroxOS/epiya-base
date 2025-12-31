// middleware/logger.js - Request/Response logging middleware

import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log incoming request
  logger.logRequest(req, {
    body: req.method === 'POST' ? { ...req.body, message: req.body?.message?.substring(0, 100) } : undefined
  });

  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    logger.logResponse(req, res, duration);
    originalSend.call(this, data);
  };

  res.json = function (data) {
    const duration = Date.now() - startTime;
    logger.logResponse(req, res, duration, {
      responseSize: JSON.stringify(data).length
    });
    originalJson.call(this, data);
  };

  next();
};