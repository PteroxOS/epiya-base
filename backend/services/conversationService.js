// services/conversationService.js - Conversation storage and learning

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConversationService {
  constructor() {
    this.storageDir = path.join(__dirname, '..', 'data', 'conversations');
    this.indexFile = path.join(__dirname, '..', 'data', 'conversations-index.json');
    this.retentionDays = parseInt(process.env.CONVERSATION_RETENTION_DAYS) || 30;
    
    this.initStorage();
  }

  initStorage() {
    // Create directories if not exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    // Create index file if not exist
    if (!fs.existsSync(this.indexFile)) {
      fs.writeFileSync(this.indexFile, JSON.stringify({ conversations: {} }), 'utf8');
    }
  }

  getConversationPath(conversationId) {
    return path.join(this.storageDir, `${conversationId}.json`);
  }

  async loadIndex() {
    try {
      const data = fs.readFileSync(this.indexFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to load conversation index', { error: error.message });
      return { conversations: {} };
    }
  }

  async saveIndex(index) {
    try {
      fs.writeFileSync(this.indexFile, JSON.stringify(index, null, 2), 'utf8');
    } catch (error) {
      logger.error('Failed to save conversation index', { error: error.message });
    }
  }

  async getConversation(conversationId) {
    const filePath = this.getConversationPath(conversationId);
    
    try {
      if (!fs.existsSync(filePath)) {
        // Create new conversation
        const conversation = {
          id: conversationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          metadata: {
            totalMessages: 0,
            userMessages: 0,
            assistantMessages: 0
          }
        };
        
        await this.saveConversation(conversationId, conversation);
        return conversation;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to load conversation', { 
        error: error.message, 
        conversationId 
      });
      throw error;
    }
  }

  async saveConversation(conversationId, conversation) {
    const filePath = this.getConversationPath(conversationId);
    
    try {
      conversation.updatedAt = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2), 'utf8');
      
      // Update index
      const index = await this.loadIndex();
      index.conversations[conversationId] = {
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messages.length,
        lastMessage: conversation.messages[conversation.messages.length - 1]?.content?.substring(0, 100) || ''
      };
      await this.saveIndex(index);

      logger.debug('Conversation saved', { 
        conversationId, 
        messageCount: conversation.messages.length 
      });
    } catch (error) {
      logger.error('Failed to save conversation', { 
        error: error.message, 
        conversationId 
      });
      throw error;
    }
  }

  async addMessage(conversationId, message) {
    try {
      const conversation = await this.getConversation(conversationId);
      
      conversation.messages.push({
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: message.timestamp || new Date().toISOString()
      });

      // Update metadata
      conversation.metadata.totalMessages = conversation.messages.length;
      conversation.metadata.userMessages = conversation.messages.filter(m => m.role === 'user').length;
      conversation.metadata.assistantMessages = conversation.messages.filter(m => m.role === 'assistant').length;

      await this.saveConversation(conversationId, conversation);
      
      return conversation;
    } catch (error) {
      logger.error('Failed to add message', { 
        error: error.message, 
        conversationId 
      });
      throw error;
    }
  }

  async getAllConversations() {
    try {
      const index = await this.loadIndex();
      return Object.entries(index.conversations)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      logger.error('Failed to get all conversations', { error: error.message });
      return [];
    }
  }

  async getConversationHistory(conversationId, limit = 50) {
    try {
      const conversation = await this.getConversation(conversationId);
      return conversation.messages.slice(-limit);
    } catch (error) {
      logger.error('Failed to get conversation history', { 
        error: error.message, 
        conversationId 
      });
      return [];
    }
  }

  async deleteConversation(conversationId) {
    const filePath = this.getConversationPath(conversationId);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Update index
      const index = await this.loadIndex();
      delete index.conversations[conversationId];
      await this.saveIndex(index);

      logger.info('Conversation deleted', { conversationId });
    } catch (error) {
      logger.error('Failed to delete conversation', { 
        error: error.message, 
        conversationId 
      });
      throw error;
    }
  }

  async cleanupOldConversations() {
    try {
      const index = await this.loadIndex();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let deletedCount = 0;

      for (const [conversationId, data] of Object.entries(index.conversations)) {
        const updatedAt = new Date(data.updatedAt);
        
        if (updatedAt < cutoffDate) {
          await this.deleteConversation(conversationId);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info('Old conversations cleaned up', { deletedCount });
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old conversations', { error: error.message });
      return 0;
    }
  }

  // Learning from conversations
  async generateInsights() {
    try {
      const conversations = await this.getAllConversations();
      
      const insights = {
        totalConversations: conversations.length,
        totalMessages: 0,
        averageMessagesPerConversation: 0,
        commonTopics: [],
        peakUsageHours: {},
        modelUsage: {},
        generatedAt: new Date().toISOString()
      };

      for (const conv of conversations) {
        const fullConv = await this.getConversation(conv.id);
        insights.totalMessages += fullConv.messages.length;

        // Analyze usage by hour
        const hour = new Date(fullConv.createdAt).getHours();
        insights.peakUsageHours[hour] = (insights.peakUsageHours[hour] || 0) + 1;
      }

      insights.averageMessagesPerConversation = 
        insights.totalMessages / conversations.length || 0;

      // Save insights
      const insightsPath = path.join(__dirname, '..', 'data', 'insights.json');
      fs.writeFileSync(insightsPath, JSON.stringify(insights, null, 2), 'utf8');

      logger.info('Conversation insights generated', insights);
      return insights;
    } catch (error) {
      logger.error('Failed to generate insights', { error: error.message });
      return null;
    }
  }
}

export const conversationService = new ConversationService();