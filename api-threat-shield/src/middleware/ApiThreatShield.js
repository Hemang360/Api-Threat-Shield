const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class ApiThreatShield {
  constructor(options = {}) {
    this.options = {
      honeypotUrl: options.honeypotUrl || 'http://localhost:3001',
      useGemini: options.useGemini || false,
      geminiApiKey: options.geminiApiKey || '',
      geminiEndpoint: options.geminiEndpoint || 'generativelanguage.googleapis.com',
      rateLimit: options.rateLimit || 100,
      banDuration: options.banDuration || 10 * 60 * 1000, 
      sensitivePatterns: options.sensitivePatterns || [
        /\b(?:union\s+select|select\s+\*?\s+from)\b/i, 
        /\b(?:exec\s*\(|update\s+.*\s+set)\b/i,
        /<script\b.*?>.*?<\/script>/i,
        /\bdocument\.cookie\b/i,
        /(?:\/etc\/passwd|\/bin\/sh|\/bin\/bash)/i,
        /\.{3,}\//i,
        /(?:\$\{.*?\}|\b(?:eval|exec|system|popen)\b\s*\()/i,
        /(?:;|\||\&|`|\$\(.+\))\s*(?:wget|curl|nc|bash|sh|python|perl)\b/i 
      ],
      logAttacks: options.logAttacks !== false,
      debug: options.debug || false
    };

    this.bannedIPs = new Map();
    this.suspiciousRequests = [];
  }

  middleware() {
    return async (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const requestId = uuidv4();

      this.clearExpiredBans();

      if (this.options.debug) {
        console.log(` Checking request ${requestId} from ${clientIP}: ${req.method} ${req.path}`);
      }

      if (this.bannedIPs.has(clientIP)) {
        console.log(` IP ${clientIP} is banned, blocking request.`);
        return res.status(403).json({ error: 'Access denied' });
      }

      const matchedPattern = this.getMatchedPattern(req);
      if (matchedPattern) {
        console.log(` Suspicious pattern detected: ${matchedPattern} in request from ${clientIP}`);
        this.logAttack(requestId, clientIP, 'pattern_match', req);
        return res.status(403).json({ error: 'Attack detected and blocked' });
      }

      if (this.options.useGemini && this.options.geminiApiKey) {
        try {
          const isThreat = await this.analyzeWithGemini(req);
          if (isThreat) {
            console.log(` AI detected threat: ${req.originalUrl}`);
            this.logAttack(requestId, clientIP, 'ai_detection', req);
            this.banIP(clientIP);
            return res.status(403).json({ error: 'Threat detected by AI' });
          }
        } catch (error) {
          console.error(' Gemini API error:', error.message);
        }
      }

      next();
    };
  }

  getMatchedPattern(req) {
    const content = `${req.originalUrl} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)} ${JSON.stringify(req.params)}`;
    if (this.options.debug) console.log(` Checking request content: ${content}`);

    for (const pattern of this.options.sensitivePatterns) {
      if (pattern.test(content)) {
        return pattern.toString(); 
      }
    }
    return null;
  }

  async analyzeWithGemini(req) {
    try {
      const requestData = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params,
        path: req.path,
        method: req.method
      });

      const response = await axios.post(
        `${this.options.geminiEndpoint}?key=${this.options.geminiApiKey}`,
        {
          contents: [{ parts: [{ text: `Analyze this request: ${requestData}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 5 }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return response.data.candidates[0]?.content?.parts[0]?.text.includes('THREAT');
    } catch (error) {
      console.error(' Gemini API error:', error.message);
      return false;
    }
  }

  banIP(ip) {
    console.log(` Banning IP: ${ip}`);
    this.bannedIPs.set(ip, Date.now());
  }

  clearExpiredBans() {
    const now = Date.now();
    this.bannedIPs.forEach((timestamp, ip) => {
      if (now - timestamp > this.options.banDuration) {
        console.log(` Unbanning IP: ${ip}`);
        this.bannedIPs.delete(ip);
      }
    });
  }

  logAttack(requestId, clientIP, detectionMethod, req) {
    console.log(` Attack detected: ${detectionMethod} - ${req.originalUrl} from ${clientIP}`);
    this.suspiciousRequests.push({ id: requestId, ip: clientIP, method: req.method, path: req.path });
  }

  getLogs() {
    return this.suspiciousRequests;
  }
}

module.exports = ApiThreatShield;
