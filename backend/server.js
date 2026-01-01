// server.js - Main Express Server dengan Multi-Provider Support

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat.js';
import { modelsRouter } from './routes/models.js';
import { conversationRouter } from './routes/conversation.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { securityMiddleware } from './middleware/security.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS - Whitelist only frontend
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Conversation-ID']
}));

// Rate Limiting - Anti DDoS
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ 
      error: 'Too many requests', 
      message: 'Please slow down and try again later.' 
    });
  }
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { error: 'Too many chat requests, please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use(requestLogger);

// Security checks (bot detection, etc)
app.use(securityMiddleware);

// API Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/chat', chatLimiter, chatRouter);
app.use('/api/v1/models', modelsRouter);  // NEW: Model management routes
app.use('/api/v1/conversations', conversationRouter);

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: process.env.AI_NAME || 'EPIYA-AI',
    version: '2.0.0',
    description: 'Multi-Provider AI Backend API',
    endpoints: {
      health: '/api/v1/health',
      chat: '/api/v1/chat',
      models: '/api/v1/models',
      conversations: '/api/v1/conversations'
    },
    documentation: 'https://github.com/yourusername/epiya-ai-backend'
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  logger.info('='.repeat(60));
  logger.info(`🚀 EPIYA-AI Backend Server Started`);
  logger.info(`📡 Port: ${PORT}`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🤖 AI Name: ${process.env.AI_NAME || 'EPIYA-AI'}`);
  logger.info(`✅ Allowed Origins: ${allowedOrigins.join(', ')}`);
  logger.info(`🎯 Multi-Provider Support: Local + Minitool (GPT)`);
  logger.info('='.repeat(60));
});

export default app;