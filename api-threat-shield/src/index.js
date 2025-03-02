const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sanitize = require('mongo-sanitize');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ApiThreatShield = require('./middleware/ApiThreatShield');

const logFile = path.join(__dirname, 'security.log');

function logSecurityEvent(event) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${event}\n`);
}

// 🛡️ **Injection Prevention**
function detectInjection(req, res, next) {
    req.body = sanitize(req.body);
    logSecurityEvent(`Sanitized Request: ${req.method} ${req.url}`);
    next();
}

// 🚀 **Rate Limiting (Brute Force & API Abuse Protection)**
const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // Limit each IP to 50 requests
    message: { error: 'Too many requests, try again later.' },
    handler: (req, res) => {
        logSecurityEvent(`Rate Limit Exceeded: ${req.ip}`);
        res.status(429).json({ error: 'Too many requests, try again later.' });
    }
});

const app = express();
app.use(express.json());

// 🔐 **Apply Security Enhancements**
app.use(helmet()); // Secure HTTP headers
app.use(cors({ origin: ['https://yourdomain.com'], methods: ['GET', 'POST'] }));
app.use(detectInjection);
app.use(rateLimiter);

// ✅ **Initialize the Threat Shield Middleware**
const threatShield = new ApiThreatShield({
    honeypotUrl: 'http://localhost:3001',
    useGemini: true,
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    rateLimit: 50,
    sensitivePatterns: [
        /\bunion\s+select\b/i, // More strict SQLi detection
    /\bexec\s*\(/i,
    /<script>/i,
    /\bdocument\.cookie\b/i,
    /\/etc\/passwd/i,
    /\.{3,}\//i, // Require at least three dots for Path Traversal
    /\$ne|gt|lt|in/i, // NoSQL injection
    /(curl|wget|nc|bash|sh|python|perl)/i // RCE
    ],
    debug: false
});

// 🛡 **Apply Threat Shield Protection**
app.use(threatShield.middleware());

// 📌 **Regular API Routes**
app.get('/api/users', (req, res) => {
    res.json({
        users: [
            { id: 1, name: 'John Doe' },
            { id: 2, name: 'Jane Smith' }
        ]
    });
});

app.post('/api/data', (req, res) => {
    res.json({ success: true, message: 'Data received' });
});

// 🔍 **Admin Route for Security Logs**
app.get('/admin/logs', (req, res) => {
    res.json(threatShield.getLogs());
});

// 🚀 **Start the Main API Server**
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
});

// 🍯 **Honeypot Server Setup**
const honeypot = express();
honeypot.use(express.json());

// 📌 **Log Honeypot Requests**
honeypot.use((req, res, next) => {
    console.log('🍯 Honeypot accessed:', {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        ip: req.ip
    });
    next();
});

// 🌐 **Generic Response for Honeypot**
honeypot.all('*', (req, res) => {
    res.json({
        status: 'success',
        data: {
            id: Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            message: 'Operation completed successfully'
        }
    });
});

// ✅ **Start the Honeypot Server**
const HONEYPOT_PORT = process.env.HONEYPOT_PORT || 3001;
honeypot.listen(HONEYPOT_PORT, () => {
    console.log(`🍯 Honeypot server running on port ${HONEYPOT_PORT}`);
});
