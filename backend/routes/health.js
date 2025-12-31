// routes/health.js - Health check and status routes

import express from 'express';
import os from 'os';
import { conversationService } from '../services/conversationService.js';

const router = express.Router();

// GET /api/v1/health - Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// GET /api/v1/health/detailed - Detailed system info
router.get('/detailed', async (req, res) => {
  try {
    const conversations = await conversationService.getAllConversations();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        platform: process.platform,
        nodeVersion: process.version,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          processUsage: process.memoryUsage()
        },
        cpu: {
          model: os.cpus()[0].model,
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        }
      },
      application: {
        name: process.env.AI_NAME || 'EPIYA-AI',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        defaultModel: process.env.DEFAULT_MODEL || 'MiniMax-M2-Stable'
      },
      statistics: {
        totalConversations: conversations.length,
        activeConversations: conversations.filter(c => {
          const updatedAt = new Date(c.updatedAt);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return updatedAt > dayAgo;
        }).length
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export { router as healthRouter };