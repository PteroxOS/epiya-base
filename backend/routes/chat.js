// routes/chat.js - Chat routes with streaming support

import express from 'express';
import { aiAgent } from '../services/aiAgent.js';
import { conversationService } from '../services/conversationService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /api/v1/chat - Send message and get AI response
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const { message, model, conversationId, history, stream = true } = req.body;

  // Validation
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('Invalid message in chat request');
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Message is required and must be a non-empty string'
    });
  }

  if (!conversationId || !conversationId.startsWith('chat-')) {
    logger.warn('Invalid conversation ID', { conversationId });
    return res.status(400).json({
      error: 'Invalid conversation ID',
      message: 'Conversation ID must start with "chat-"'
    });
  }

  logger.logRequest(req, {
    conversationId,
    model: model || 'default',
    messageLength: message.length,
    historyLength: history?.length || 0
  });

  try {
    // Save user message to conversation
    await conversationService.addMessage(conversationId, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Get AI response with streaming
    if (stream) {
      // Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      const result = await aiAgent.chat({
        message,
        model,
        history,
        stream: true
      });

      if (!result.success) {
        throw new Error('Failed to get AI response');
      }

      let fullContent = '';
      let chunkCount = 0;

      result.stream.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              res.write(`data: [DONE]\n\n`);
              
              // Save assistant message
              conversationService.addMessage(conversationId, {
                role: 'assistant',
                content: fullContent,
                timestamp: new Date().toISOString()
              }).catch(err => logger.error('Failed to save assistant message', { error: err.message }));

              const duration = Date.now() - startTime;
              logger.logAIInteraction(conversationId, model || 'default', chunkCount, fullContent.length, duration);
              
              res.end();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content) {
                fullContent += content;
                chunkCount++;
                res.write(`data: ${data}\n\n`);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      });

      result.stream.on('error', (error) => {
        logger.error('Stream error', { error: error.message, conversationId });
        res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
        res.end();
      });

      result.stream.on('end', () => {
        if (!res.writableEnded) {
          res.write(`data: [DONE]\n\n`);
          res.end();
        }
      });

    } else {
      // Non-streaming response
      const result = await aiAgent.chat({
        message,
        model,
        history,
        stream: false
      });

      if (!result.success) {
        throw new Error('Failed to get AI response');
      }

      // Save assistant message
      await conversationService.addMessage(conversationId, {
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toISOString()
      });

      const duration = Date.now() - startTime;
      logger.logResponse(req, res, duration, {
        conversationId,
        tokensUsed: result.usage?.total_tokens || 0
      });

      res.json({
        success: true,
        response: result.content,
        conversationId,
        model: result.model,
        usage: result.usage,
        duration
      });
    }

  } catch (error) {
    logger.error('Chat error', {
      error: error.message,
      stack: error.stack,
      conversationId,
      duration: Date.now() - startTime
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process chat request',
        conversationId
      });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// GET /api/v1/chat/models - Get available models
router.get('/models', (req, res) => {
  const models = [
    {
      id: 'deepseek-coder-v2',
      name: 'DeepSeek Coder V2',
      description: 'Best for coding tasks and technical questions',
      recommended: false
    },
    {
      id: 'llama3.1:8b',
      name: 'Llama 3.1 8B',
      description: 'Fast general-purpose model for everyday conversations',
      recommended: false
    },
    {
      id: 'qwen2.5:1.5b',
      name: 'Qwen 2.5 1.5B',
      description: 'Lightweight and quick for simple queries',
      recommended: false
    },
    {
      id: 'MiniMax-M2',
      name: 'MiniMax M2',
      description: 'Balanced performance for various tasks',
      recommended: false
    },
    {
      id: 'MiniMax-M2-Stable',
      name: 'MiniMax M2 Stable',
      description: 'Stable release with reliable performance',
      recommended: true
    }
  ];

  res.json({
    models,
    default: process.env.DEFAULT_MODEL || 'MiniMax-M2-Stable'
  });
});

export { router as chatRouter };