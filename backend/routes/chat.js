// routes/chat.js - Updated chat routes dengan unified AI service

import express from 'express';
import { unifiedAIService } from '../services/unifiedAIService.js';
import { conversationService } from '../services/conversationService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /api/v1/chat - Send message and get AI response
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const { message, model, conversationId, history, temperature, stream = true } = req.body;

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

  // Validate model if provided
  if (model && !unifiedAIService.isValidModel(model)) {
    return res.status(400).json({
      error: 'Invalid model',
      message: `Model '${model}' is not available. Use GET /api/v1/models to see available models.`
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

    // Get AI response with streaming (if supported by provider)
    if (stream) {
      // Check if model supports streaming
      const modelInfo = model ? unifiedAIService.getModelInfo(model) : null;
      const supportsStreaming = !modelInfo || modelInfo.streaming !== false;

      if (!supportsStreaming) {
        // Fallback to non-streaming for models that don't support it
        logger.debug('Model does not support streaming, using non-streaming mode', { model });
        
        const result = await unifiedAIService.chat({
          message,
          model,
          history,
          temperature,
          stream: false
        });

        if (!result.success) {
          throw new Error('Failed to get AI response');
        }

        await conversationService.addMessage(conversationId, {
          role: 'assistant',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: {
            model: result.model,
            provider: result.provider
          }
        });

        const duration = Date.now() - startTime;
        logger.logResponse(req, res, duration, {
          conversationId,
          provider: result.provider
        });

        return res.json({
          success: true,
          response: result.content,
          conversationId,
          model: result.model,
          provider: result.provider,
          usage: result.usage,
          duration,
          streaming: false
        });
      }

      // SSE Streaming for supported models
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const result = await unifiedAIService.chat({
        message,
        model,
        history,
        temperature,
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
              
              conversationService.addMessage(conversationId, {
                role: 'assistant',
                content: fullContent,
                timestamp: new Date().toISOString(),
                metadata: {
                  model: result.model,
                  provider: result.provider
                }
              }).catch(err => logger.error('Failed to save assistant message', { error: err.message }));

              const duration = Date.now() - startTime;
              logger.logAIInteraction(conversationId, result.model || model || 'default', chunkCount, fullContent.length, duration);
              
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
      const result = await unifiedAIService.chat({
        message,
        model,
        history,
        temperature,
        stream: false
      });

      if (!result.success) {
        throw new Error('Failed to get AI response');
      }

      // Save assistant message
      await conversationService.addMessage(conversationId, {
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toISOString(),
        metadata: {
          model: result.model,
          provider: result.provider
        }
      });

      const duration = Date.now() - startTime;
      logger.logResponse(req, res, duration, {
        conversationId,
        provider: result.provider
      });

      res.json({
        success: true,
        response: result.content,
        conversationId,
        model: result.model,
        provider: result.provider,
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
        message: error.message || 'Failed to process chat request',
        conversationId
      });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// GET /api/v1/chat/models - Get available models (deprecated, use /api/v1/models)
router.get('/models', (req, res) => {
  const models = unifiedAIService.getAllModels();
  const defaultModel = process.env.DEFAULT_MODEL || 'MiniMax-M2';

  res.json({
    success: true,
    deprecated: true,
    message: 'This endpoint is deprecated. Please use GET /api/v1/models instead.',
    models: models.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      recommended: m.recommended
    })),
    default: defaultModel
  });
});

export { router as chatRouter };