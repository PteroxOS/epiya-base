// scripts/cleanup.js - Manual cleanup script for old conversations

import dotenv from 'dotenv';
import { conversationService } from '../services/conversationService.js';
import { logger } from '../utils/logger.js';

dotenv.config();

async function runCleanup() {
  logger.info('Starting manual conversation cleanup...');
  
  try {
    const deletedCount = await conversationService.cleanupOldConversations();
    
    logger.info(`Cleanup completed successfully. Deleted ${deletedCount} conversations.`);
    
    // Generate insights after cleanup
    const insights = await conversationService.generateInsights();
    
    if (insights) {
      logger.info('Insights generated:', insights);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Cleanup failed', { error: error.message });
    process.exit(1);
  }
}

runCleanup();