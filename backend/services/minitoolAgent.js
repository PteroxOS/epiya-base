// services/minitoolAgent.js - ChatGPT scraper integration

import axios from 'axios';
import { logger } from '../utils/logger.js';

class MinitoolAgent {
  constructor() {
    this.baseURL = 'https://minitoolai.com';
    this.chatEndpoint = '/chatGPT/';
    this.streamEndpoint = '/chatGPT/chatgpt_stream.php';
    this.cfBypassAPI = 'https://api.nekolabs.web.id/tls/bypass/cf-turnstile';
    
    this.availableModels = [
      'gpt-4o-mini',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'gpt-5-mini',
      'gpt-5-nano',
      'gpt-3.5-turbo'
    ];

    this.modelDescriptions = {
      'gpt-4o-mini': 'GPT-4o Mini - Fast and efficient for most tasks',
      'gpt-4.1-mini': 'GPT-4.1 Mini - Advanced reasoning with compact size',
      'gpt-4.1-nano': 'GPT-4.1 Nano - Ultra-lightweight for simple queries',
      'gpt-5-mini': 'GPT-5 Mini - Next-gen compact model',
      'gpt-5-nano': 'GPT-5 Nano - Fastest response for quick questions',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo - Classic reliable model'
    };
  }

  validateModel(model) {
    if (!this.availableModels.includes(model)) {
      throw new Error(`Invalid model. Available: ${this.availableModels.join(', ')}`);
    }
  }

  async getCfToken() {
    try {
      const { data } = await axios.post(this.cfBypassAPI, {
        url: `${this.baseURL}${this.chatEndpoint}`,
        siteKey: '0x4AAAAAABjI2cBIeVpBYEFi'
      });

      if (!data?.result) {
        throw new Error('Failed to get Cloudflare token');
      }

      return data.result;
    } catch (error) {
      logger.error('CF bypass failed', { error: error.message });
      throw new Error('Cloudflare bypass failed');
    }
  }

  async getPageTokens() {
    try {
      const { data: html, headers } = await axios.get(`${this.baseURL}${this.chatEndpoint}`);

      const safety_identifier = html.match(/var\s+safety_identifier\s*=\s*"([^"]*)"/)?.[1];
      const utoken = html.match(/var\s+utoken\s*=\s*"([^"]*)"/)?.[1];

      if (!safety_identifier) {
        throw new Error('Failed to extract safety_identifier');
      }

      if (!utoken) {
        throw new Error('Failed to extract utoken');
      }

      return {
        safety_identifier,
        utoken,
        cookies: headers['set-cookie']
      };
    } catch (error) {
      logger.error('Failed to get page tokens', { error: error.message });
      throw error;
    }
  }

  buildHeaders(cookies) {
    return {
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'cookie': cookies.join('; '),
      'origin': this.baseURL,
      'referer': `${this.baseURL}${this.chatEndpoint}`,
      'sec-ch-ua': '"Chromium";v="137", "Not(A)Brand";v="24"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
      'x-requested-with': 'XMLHttpRequest'
    };
  }

  /**
   * Extract text dari response OpenAI-style format
   */
  extractTextFromResponse(responseData) {
    // Format 1: String langsung (backward compatibility)
    if (typeof responseData === 'string') {
      return responseData.trim();
    }

    // Format 2: OpenAI-style dengan output array
    if (responseData?.output && Array.isArray(responseData.output)) {
      const result = responseData.output
        .filter(item => item.type === 'message')
        .flatMap(item => Array.isArray(item.content) ? item.content : [])
        .filter(content => ['text', 'output_text'].includes(content.type))
        .map(content => content.text)
        .filter(Boolean)
        .join('\n')
        .trim();

      if (result) {
        return result;
      }
    }

    // Format 3: Fallback untuk format lain
    const possibleKeys = ['message', 'answer', 'result', 'content'];
    for (const key of possibleKeys) {
      if (responseData[key] && typeof responseData[key] === 'string') {
        return responseData[key].trim();
      }
    }

    logger.error('Unable to extract text from response', {
      responseType: typeof responseData,
      hasOutput: !!responseData?.output,
      availableKeys: Object.keys(responseData || {})
    });

    throw new Error('Unable to extract text from response format');
  }

  async chat({ question, model = 'gpt-4o-mini', temperature = 0.7 }) {
    const startTime = Date.now();

    this.validateModel(model);

    if (!question || question.trim().length === 0) {
      throw new Error('Question is required');
    }

    try {
      // Step 1: Get CF token
      const cfToken = await this.getCfToken();

      // Step 2: Get page tokens
      const { safety_identifier, utoken, cookies } = await this.getPageTokens();

      // Step 3: Send chat request
      const payload = new URLSearchParams({
        messagebase64img1: '',
        messagebase64img0: '',
        safety_identifier,
        select_model: model,
        temperature: temperature.toString(),
        utoken,
        message: question,
        umes1a: '',
        umes1stimg1a: '',
        umes2ndimg1a: '',
        bres1a: '',
        umes2a: '',
        umes1stimg2a: '',
        umes2ndimg2a: '',
        bres2a: '',
        cft: encodeURIComponent(cfToken)
      });

      const headers = this.buildHeaders(cookies);

      const { data: streamToken } = await axios.post(
        `${this.baseURL}${this.streamEndpoint}`,
        payload.toString(),
        { headers }
      );

      // Step 4: Get response stream
      const { data: streamData } = await axios.get(
        `${this.baseURL}${this.streamEndpoint}`,
        {
          headers: {
            ...headers,
            'content-type': undefined
          },
          params: { streamtoken: streamToken }
        }
      );

      // Step 5: Parse SSE (Server-Sent Events) response
      const parsedLines = streamData
        .split('\n\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            const lines = line.split('\n');
            const dataLine = lines.find(l => l.startsWith('data: '));
            
            if (dataLine) {
              const jsonStr = dataLine.substring(6);
              return JSON.parse(jsonStr);
            }
          } catch (e) {
            // Skip invalid lines
          }
          return null;
        })
        .filter(Boolean);

      // Step 6: Find completed response
      const completedResponse = parsedLines.find(line => line.type === 'response.completed');

      if (!completedResponse || !completedResponse.response) {
        throw new Error('No valid response from AI');
      }

      // Step 7: Extract text from response
      const result = this.extractTextFromResponse(completedResponse.response);

      if (!result || result.length === 0) {
        throw new Error('Empty response text');
      }

      const duration = Date.now() - startTime;
      const usage = completedResponse.response?.usage || null;

      logger.info('Minitool AI response received', {
        model,
        responseLength: result.length,
        duration: `${duration}ms`,
        ...(usage && {
          tokens: {
            input: usage.input_tokens,
            output: usage.output_tokens,
            total: usage.total_tokens
          }
        })
      });

      return {
        success: true,
        content: result,
        model,
        duration,
        provider: 'minitool-ai',
        ...(usage && { usage })
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Minitool AI request failed', {
        error: error.message,
        model,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  getAvailableModels() {
    return this.availableModels.map(id => ({
      id,
      name: id.toUpperCase().replace(/\./g, ' '),
      description: this.modelDescriptions[id] || 'AI model',
      provider: 'minitool-ai',
      available: true
    }));
  }

  getModelInfo(modelId) {
    if (!this.availableModels.includes(modelId)) {
      return null;
    }

    return {
      id: modelId,
      name: modelId.toUpperCase().replace(/\./g, ' '),
      description: this.modelDescriptions[modelId] || 'AI model',
      provider: 'minitool-ai',
      available: true,
      features: {
        streaming: false,
        contextWindow: 4096,
        maxTokens: 4096,
        temperature: { min: 0, max: 1, default: 0.7 }
      }
    };
  }
}

export const minitoolAgent = new MinitoolAgent();