// middleware/security.js - Bot detection and security checks

import { logger } from '../utils/logger.js';

// Simple bot detection patterns
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /go-http-client/i,
  /java/i
];

// Suspicious user agents that are not real browsers
const SUSPICIOUS_AGENTS = [
  'PostmanRuntime',
  'Insomnia',
  'Thunder Client',
  'REST Client'
];

class SecurityService {
  constructor() {
    this.suspiciousIPs = new Map(); // IP -> { count, lastAttempt }
    this.blockedIPs = new Set();
    this.maxSuspiciousAttempts = 10;
    this.suspiciousWindow = 60000; // 1 minute
  }

  isBot(userAgent) {
    if (!userAgent) return true;

    // Check bot patterns
    for (const pattern of BOT_PATTERNS) {
      if (pattern.test(userAgent)) {
        return true;
      }
    }

    // Check suspicious agents
    for (const agent of SUSPICIOUS_AGENTS) {
      if (userAgent.includes(agent)) {
        return true;
      }
    }

    return false;
  }

  isSuspiciousRequest(req) {
    const suspicious = [];

    // No user agent
    if (!req.get('user-agent')) {
      suspicious.push('missing_user_agent');
    }

    // No referer (could be direct API access)
    if (!req.get('referer') && !req.get('origin')) {
      suspicious.push('missing_referer');
    }

    // Unusual content-type for non-API routes
    const contentType = req.get('content-type');
    if (contentType && !contentType.includes('application/json') && req.method === 'POST') {
      suspicious.push('unusual_content_type');
    }

    return suspicious;
  }

  trackSuspiciousIP(ip) {
    const now = Date.now();
    const record = this.suspiciousIPs.get(ip);

    if (!record) {
      this.suspiciousIPs.set(ip, { count: 1, lastAttempt: now });
      return false;
    }

    // Reset if outside window
    if (now - record.lastAttempt > this.suspiciousWindow) {
      this.suspiciousIPs.set(ip, { count: 1, lastAttempt: now });
      return false;
    }

    // Increment count
    record.count++;
    record.lastAttempt = now;

    // Block if exceeds threshold
    if (record.count > this.maxSuspiciousAttempts) {
      this.blockedIPs.add(ip);
      logger.warn('IP blocked due to suspicious activity', { ip, attempts: record.count });
      return true;
    }

    return false;
  }

  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    logger.info('IP unblocked', { ip });
  }

  // Clean up old records periodically
  cleanup() {
    const now = Date.now();
    const cleanupWindow = 3600000; // 1 hour

    for (const [ip, record] of this.suspiciousIPs.entries()) {
      if (now - record.lastAttempt > cleanupWindow) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}

const securityService = new SecurityService();

// Run cleanup every hour
setInterval(() => {
  securityService.cleanup();
}, 3600000);

export const securityMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  // Check if IP is blocked
  if (securityService.isBlocked(ip)) {
    logger.warn('Blocked IP attempted access', { ip, path: req.path });
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP has been temporarily blocked due to suspicious activity'
    });
  }

  // Check for bot
  if (securityService.isBot(userAgent)) {
    logger.warn('Bot detected', { ip, userAgent, path: req.path });
    
    // Track suspicious activity
    const shouldBlock = securityService.trackSuspiciousIP(ip);
    
    if (shouldBlock) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Bot traffic is not allowed'
      });
    }

    // Allow but log
    logger.info('Bot request allowed with warning', { ip, path: req.path });
  }

  // Check for other suspicious patterns
  const suspiciousFlags = securityService.isSuspiciousRequest(req);
  
  if (suspiciousFlags.length > 0) {
    logger.debug('Suspicious request detected', {
      ip,
      flags: suspiciousFlags,
      path: req.path,
      userAgent
    });

    // Track but don't block immediately
    securityService.trackSuspiciousIP(ip);
  }

  next();
};

export { securityService };