// routes/conversation.js - Conversation management routes

import express from 'express';
import { conversationService } from '../services/conversationService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/v1/conversations - Get all conversations
router.get('/', async (req, res) => {
  try {
    const conversations = await conversationService.getAllConversations();
    
    res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    logger.error('Failed to get conversations', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve conversations'
    });
  }
});

// GET /api/v1/conversations/:id - Get specific conversation
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id.startsWith('chat-')) {
    return res.status(400).json({
      error: 'Invalid conversation ID'
    });
  }

  try {
    const conversation = await conversationService.getConversation(id);
    
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    logger.error('Failed to get conversation', { 
      error: error.message, 
      conversationId: id 
    });
    res.status(500).json({
      error: 'Failed to retrieve conversation'
    });
  }
});

// GET /api/v1/conversations/:id/history - Get conversation history
router.get('/:id/history', async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  if (!id.startsWith('chat-')) {
    return res.status(400).json({
      error: 'Invalid conversation ID'
    });
  }

  try {
    const history = await conversationService.getConversationHistory(id, limit);
    
    res.json({
      success: true,
      conversationId: id,
      messageCount: history.length,
      messages: history
    });
  } catch (error) {
    logger.error('Failed to get conversation history', { 
      error: error.message, 
      conversationId: id 
    });
    res.status(500).json({
      error: 'Failed to retrieve conversation history'
    });
  }
});

// DELETE /api/v1/conversations/:id - Delete conversation
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id.startsWith('chat-')) {
    return res.status(400).json({
      error: 'Invalid conversation ID'
    });
  }

  try {
    await conversationService.deleteConversation(id);
    
    res.json({
      success: true,
      message: 'Conversation deleted successfully',
      conversationId: id
    });
  } catch (error) {
    logger.error('Failed to delete conversation', { 
      error: error.message, 
      conversationId: id 
    });
    res.status(500).json({
      error: 'Failed to delete conversation'
    });
  }
});

// GET /api/v1/conversations/insights - Get conversation insights
router.get('/analytics/insights', async (req, res) => {
  try {
    const insights = await conversationService.generateInsights();
    
    if (!insights) {
      throw new Error('Failed to generate insights');
    }

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    logger.error('Failed to get insights', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate insights'
    });
  }
});

// POST /api/v1/conversations/cleanup - Cleanup old conversations
router.post('/cleanup', async (req, res) => {
  try {
    const deletedCount = await conversationService.cleanupOldConversations();
    
    res.json({
      success: true,
      message: 'Cleanup completed',
      deletedCount
    });
  } catch (error) {
    logger.error('Failed to cleanup conversations', { error: error.message });
    res.status(500).json({
      error: 'Failed to cleanup conversations'
    });
  }
});

export { router as conversationRouter };