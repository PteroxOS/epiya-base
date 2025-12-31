// services/aiAgent.js - AI Agent with streaming support

import axios from 'axios';
import { logger } from '../utils/logger.js';

class AIAgent {
  constructor() {
    this.baseURL = process.env.AI_BASE_URL || 'http://161.97.152.192:8002';
    this.endpoint = process.env.AI_API_ENDPOINT || '/v1/chat/completions';
    this.defaultModel = process.env.DEFAULT_MODEL || 'MiniMax-M2';
    this.defaultTemperature = parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7;
    this.maxTokens = parseInt(process.env.MAX_TOKENS) || 4096;
    
    this.headers = {
      'user-agent': 'EPIYA-AI Backend/1.0.0',
      'content-type': 'application/json',
      'origin': this.baseURL,
      'referer': `${this.baseURL}/`
    };

    this.validModels = [
      'deepseek-coder-v2',
      'llama3.1:8b',
      'qwen2.5:1.5b',
      'MiniMax-M2',
      'MiniMax-M2-Stable'
    ];
  }

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

  validateModel(model) {
    if (!this.validModels.includes(model)) {
      throw new Error(`Invalid model. Available models: ${this.validModels.join(', ')}`);
    }
  }

  prepareMessages(userMessage, history = []) {
    const messages = [
      {
        role: 'system',
        content: this.buildSystemPrompt()
      }
    ];

    // Add conversation history
    if (Array.isArray(history) && history.length > 0) {
      const validHistory = history
        .filter(msg => msg.role && msg.content)
        .slice(-20); // Keep last 20 messages for context
      
      messages.push(...validHistory);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  async chat({ message, model = null, history = [], temperature = null, stream = false }) {
    const selectedModel = model || this.defaultModel;
    const temp = temperature !== null ? temperature : this.defaultTemperature;

    this.validateModel(selectedModel);

    const messages = this.prepareMessages(message, history);
    const payload = {
      model: selectedModel,
      messages,
      stream,
      temperature: temp,
      max_tokens: this.maxTokens
    };

    const url = `${this.baseURL}${this.endpoint}`;
    const startTime = Date.now();

    logger.debug('Sending request to AI', {
      model: selectedModel,
      messageCount: messages.length,
      stream
    });

    try {
      if (stream) {
        return await this.streamChat(url, payload, startTime);
      } else {
        return await this.nonStreamChat(url, payload, startTime);
      }
    } catch (error) {
      logger.error('AI request failed', {
        error: error.message,
        model: selectedModel,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  async nonStreamChat(url, payload, startTime) {
    const response = await axios.post(url, payload, {
      headers: this.headers,
      timeout: 120000
    });

    const data = response.data;
    const choice = data.choices?.[0];

    if (!choice?.message?.content) {
      throw new Error('No response content from AI');
    }

    const duration = Date.now() - startTime;

    logger.info('AI response received', {
      model: data.model,
      tokensUsed: data.usage?.total_tokens || 0,
      duration: `${duration}ms`
    });

    return {
      success: true,
      content: choice.message.content.trim(),
      role: choice.message.role || 'assistant',
      finishReason: choice.finish_reason,
      usage: data.usage || null,
      model: data.model,
      duration
    };
  }

  async streamChat(url, payload, startTime) {
    const response = await axios.post(url, payload, {
      headers: this.headers,
      timeout: 120000,
      responseType: 'stream'
    });

    return {
      success: true,
      stream: response.data,
      startTime
    };
  }
}

export const aiAgent = new AIAgent();