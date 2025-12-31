// utils/logger.js - Advanced Logger with JSON file output

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  constructor() {
    this.logDir = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logToFile = process.env.LOG_TO_FILE === 'true';
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Create logs directory if not exists
    if (this.logToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  getLogFileName() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${date}.json`);
  }

  formatLog(level, message, meta = {}) {
    return {
      timestamp: this.getTimestamp(),
      level: level.toUpperCase(),
      message,
      ...meta,
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  writeToFile(logEntry) {
    if (!this.logToFile) return;

    try {
      const logFile = this.getLogFileName();
      const logLine = JSON.stringify(logEntry) + '\n';
      
      fs.appendFileSync(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write log to file:', error.message);
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLog(level, message, meta);
    
    // Console output with colors
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m'  // Gray
    };
    const reset = '\x1b[0m';
    
    const consoleMessage = `${colors[level]}[${logEntry.timestamp}] ${logEntry.level}:${reset} ${message}`;
    
    if (level === 'error') {
      console.error(consoleMessage, meta);
    } else if (level === 'warn') {
      console.warn(consoleMessage, meta);
    } else {
      console.log(consoleMessage, meta);
    }

    // Write to file
    this.writeToFile(logEntry);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Special method for API requests
  logRequest(req, meta = {}) {
    this.info('API Request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      conversationId: req.get('X-Conversation-ID') || req.body?.conversationId,
      ...meta
    });
  }

  // Special method for API responses
  logResponse(req, res, duration, meta = {}) {
    this.info('API Response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ...meta
    });
  }

  // Special method for AI interactions
  logAIInteraction(conversationId, model, messageCount, tokensUsed, duration) {
    this.info('AI Interaction', {
      conversationId,
      model,
      messageCount,
      tokensUsed,
      duration: `${duration}ms`
    });
  }
}

export const logger = new Logger();