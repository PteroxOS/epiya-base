// routes/models.js - Model management and selection routes

import express from 'express';
import { unifiedAIService } from '../services/unifiedAIService.js';
import { conversationService } from '../services/conversationService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/v1/models - Get all available models
router.get('/', (req, res) => {
  try {
    const models = unifiedAIService.getAllModels();
    const defaultModel = process.env.DEFAULT_MODEL || 'MiniMax-M2';

    res.json({
      success: true,
      total: models.length,
      default: defaultModel,
      models,
      categories: {
        general: models.filter(m => m.category === 'general').length,
        coding: models.filter(m => m.category === 'coding').length,
        openai: models.filter(m => m.category === 'openai').length
      }
    });
  } catch (error) {
    logger.error('Failed to get models', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve models'
    });
  }
});

// GET /api/v1/models/providers - Get models grouped by provider
router.get('/providers', (req, res) => {
  try {
    const models = unifiedAIService.getAllModels();
    
    const grouped = models.reduce((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    }, {});

    res.json({
      success: true,
      providers: Object.keys(grouped),
      models: grouped
    });
  } catch (error) {
    logger.error('Failed to get models by provider', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve models'
    });
  }
});

// GET /api/v1/models/categories - Get models grouped by category
router.get('/categories', (req, res) => {
  try {
    const models = unifiedAIService.getAllModels();
    
    const grouped = models.reduce((acc, model) => {
      if (!acc[model.category]) {
        acc[model.category] = [];
      }
      acc[model.category].push(model);
      return acc;
    }, {});

    res.json({
      success: true,
      categories: Object.keys(grouped),
      models: grouped
    });
  } catch (error) {
    logger.error('Failed to get models by category', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve models'
    });
  }
});

// GET /api/v1/models/:modelId - Get specific model info
router.get('/:modelId', (req, res) => {
  const { modelId } = req.params;

  try {
    const modelInfo = unifiedAIService.getModelInfo(modelId);

    if (!modelInfo) {
      return res.status(404).json({
        error: 'Model not found',
        message: `Model '${modelId}' does not exist`
      });
    }

    res.json({
      success: true,
      model: modelInfo
    });
  } catch (error) {
    logger.error('Failed to get model info', { 
      error: error.message, 
      modelId 
    });
    res.status(500).json({
      error: 'Failed to retrieve model information'
    });
  }
});

// POST /api/v1/models/:modelId/chat - Chat with specific model
router.post('/:modelId/chat', async (req, res) => {
  const startTime = Date.now();
  const { modelId } = req.params;
  const { message, conversationId, history, temperature, stream = false } = req.body;

  // Validation
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('Invalid message in model chat request');
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

  // Validate model exists
  if (!unifiedAIService.isValidModel(modelId)) {
    return res.status(404).json({
      error: 'Model not found',
      message: `Model '${modelId}' does not exist`
    });
  }

  logger.logRequest(req, {
    conversationId,
    model: modelId,
    messageLength: message.length,
    historyLength: history?.length || 0
  });

  try {
    // Save user message
    await conversationService.addMessage(conversationId, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Get AI response (auto-detect provider)
    const result = await unifiedAIService.chat({
      message,
      model: modelId,
      history,
      temperature,
      stream: false // Model-specific routes don't support streaming yet
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
        model: modelId,
        provider: result.provider
      }
    });

    const duration = Date.now() - startTime;
    logger.logResponse(req, res, duration, {
      conversationId,
      model: modelId,
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

  } catch (error) {
    logger.error('Model-specific chat error', {
      error: error.message,
      stack: error.stack,
      conversationId,
      model: modelId,
      duration: Date.now() - startTime
    });

    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to process chat request',
      conversationId,
      model: modelId
    });
  }
});

// GET /api/v1/models/:modelId/test - Test specific model (no conversation save)
router.post('/:modelId/test', async (req, res) => {
  const { modelId } = req.params;
  const { message, temperature } = req.body;

  if (!message) {
    return res.status(400).json({
      error: 'Message is required'
    });
  }

  if (!unifiedAIService.isValidModel(modelId)) {
    return res.status(404).json({
      error: 'Model not found',
      message: `Model '${modelId}' does not exist`
    });
  }

  try {
    const result = await unifiedAIService.chat({
      message,
      model: modelId,
      history: [],
      temperature,
      stream: false
    });

    res.json({
      success: true,
      response: result.content,
      model: result.model,
      provider: result.provider,
      duration: result.duration
    });

  } catch (error) {
    logger.error('Model test error', {
      error: error.message,
      model: modelId
    });

    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
});

export { router as modelsRouter };