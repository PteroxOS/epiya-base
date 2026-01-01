// services/unifiedAIService.js - Unified AI service untuk semua provider

import { aiAgent } from './aiAgent.js';
import { minitoolAgent } from './minitoolAgent.js';
import { logger } from '../utils/logger.js';

class UnifiedAIService {
  constructor() {
    this.providers = {
      'local': aiAgent,      // Provider original (MiniMax, DeepSeek, dll)
      'minitool': minitoolAgent  // Provider scraper (GPT models)
    };

    this.defaultProvider = 'local';
    this.defaultModel = process.env.DEFAULT_MODEL || 'MiniMax-M2';
  }

  /**
   * Get provider untuk model tertentu
   */
  getProviderForModel(model) {
    // Model dari minitoolAgent
    const minitoolModels = minitoolAgent.availableModels;
    if (minitoolModels.includes(model)) {
      return 'minitool';
    }

    // Model dari aiAgent (original)
    const localModels = aiAgent.validModels;
    if (localModels.includes(model)) {
      return 'local';
    }

    throw new Error(`Model '${model}' not found in any provider`);
  }

  /**
   * Build system prompt yang sama untuk semua provider
   */
  buildSystemPrompt() {
    const aiName = process.env.AI_NAME || 'EPIYA-AI';
    const currentDate = new Date().toLocaleString('id-ID', { 
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    return `You are ${aiName}, a helpful and friendly AI assistant created to provide accurate and thoughtful responses.

IMPORTANT GUIDELINES:
1. Current date and time: ${currentDate} (Jakarta, Indonesia timezone)
2. Always provide accurate information based on facts
3. For sensitive topics (news, politics, health, legal matters), be extra careful:
   - Acknowledge if information might be outdated
   - Suggest verifying important facts from reliable sources
   - Never make up or assume facts about recent events
4. Be honest when you don't know something
5. Be warm, professional, and helpful without excessive emojis
6. Respond in the same language the user uses
7. For coding questions, provide clear explanations and well-commented code
8. Maintain context awareness throughout the conversation

You are knowledgeable, reliable, and always prioritize truthfulness over appearing certain.`;
  }

  /**
   * Prepare messages dengan history
   */
  prepareMessages(userMessage, history = []) {
    const messages = [
      {
        role: 'system',
        content: this.buildSystemPrompt()
      }
    ];

    if (Array.isArray(history) && history.length > 0) {
      const validHistory = history
        .filter(msg => msg.role && msg.content)
        .slice(-20);
      
      messages.push(...validHistory);
    }

    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  /**
   * Main chat function - auto detect provider
   */
  async chat({ message, model = null, history = [], temperature = null, stream = false }) {
    const selectedModel = model || this.defaultModel;
    
    try {
      const providerName = this.getProviderForModel(selectedModel);
      const provider = this.providers[providerName];

      logger.debug('Routing to provider', {
        model: selectedModel,
        provider: providerName
      });

      // Minitool provider (scraper) - no streaming support
      if (providerName === 'minitool') {
        const temp = temperature !== null ? temperature : 0.7;

        // Prepare full message dengan context
        const messages = this.prepareMessages(message, history);
        
        // Combine system + history + user message untuk scraper
        const fullMessage = messages
          .map(m => `${m.role === 'system' ? 'System: ' : m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`)
          .join('\n\n');

        const result = await provider.chat({
          question: fullMessage,
          model: selectedModel,
          temperature: temp
        });

        return {
          success: true,
          content: result.content,
          role: 'assistant',
          model: result.model,
          provider: result.provider,
          duration: result.duration,
          usage: null,
          stream: false
        };
      }

      // Local provider (original) - support streaming
      if (providerName === 'local') {
        return await provider.chat({
          message,
          model: selectedModel,
          history,
          temperature,
          stream
        });
      }

      throw new Error(`Provider '${providerName}' not implemented`);

    } catch (error) {
      logger.error('Unified AI Service error', {
        error: error.message,
        model: selectedModel
      });
      throw error;
    }
  }

  /**
   * Get all available models dari semua provider
   */
  getAllModels() {
    const models = [];

    // Local models (original)
    const localModels = [
      {
        id: 'deepseek-coder-v2',
        name: 'DeepSeek Coder V2',
        description: 'Best for coding tasks and technical questions',
        provider: 'local',
        category: 'coding',
        recommended: false,
        streaming: true
      },
      {
        id: 'llama3.1:8b',
        name: 'Llama 3.1 8B',
        description: 'Fast general-purpose model for everyday conversations',
        provider: 'local',
        category: 'general',
        recommended: false,
        streaming: true
      },
      {
        id: 'qwen2.5:1.5b',
        name: 'Qwen 2.5 1.5B',
        description: 'Lightweight and quick for simple queries',
        provider: 'local',
        category: 'general',
        recommended: false,
        streaming: true
      },
      {
        id: 'MiniMax-M2',
        name: 'MiniMax M2',
        description: 'Balanced performance for various tasks',
        provider: 'local',
        category: 'general',
        recommended: false,
        streaming: true
      },
      {
        id: 'MiniMax-M2-Stable',
        name: 'MiniMax M2 Stable',
        description: 'Stable release with reliable performance',
        provider: 'local',
        category: 'general',
        recommended: true,
        streaming: true
      }
    ];

    models.push(...localModels);

    // Minitool models (scraper)
    const minitoolModels = minitoolAgent.getAvailableModels().map(m => ({
      ...m,
      category: 'openai',
      recommended: m.id === 'gpt-4o-mini',
      streaming: false
    }));

    models.push(...minitoolModels);

    return models;
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(providerName) {
    const allModels = this.getAllModels();
    return allModels.filter(m => m.provider === providerName);
  }

  /**
   * Get models by category
   */
  getModelsByCategory(category) {
    const allModels = this.getAllModels();
    return allModels.filter(m => m.category === category);
  }

  /**
   * Get model info
   */
  getModelInfo(modelId) {
    try {
      const providerName = this.getProviderForModel(modelId);
      
      if (providerName === 'minitool') {
        return minitoolAgent.getModelInfo(modelId);
      }

      // Return info for local models
      const allModels = this.getAllModels();
      return allModels.find(m => m.id === modelId) || null;

    } catch (error) {
      return null;
    }
  }

  /**
   * Check if model exists
   */
  isValidModel(modelId) {
    try {
      this.getProviderForModel(modelId);
      return true;
    } catch {
      return false;
    }
  }
}

export const unifiedAIService = new UnifiedAIService();