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

function detectInjection(req, res, next) {
    req.body = sanitize(req.body);
    logSecurityEvent(`Sanitized Request: ${req.method} ${req.url}`);
    next();
}

const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: { error: 'Too many requests, try again later.' },
    handler: (req, res) => {
        logSecurityEvent(`Rate Limit Exceeded: ${req.ip}`);
        res.status(429).json({ error: 'Too many requests, try again later.' });
    }
});

const app = express();
app.use(express.json());


app.use(helmet()); 
app.use(cors({ origin: ['https://yourdomain.com'], methods: ['GET', 'POST'] }));
app.use(detectInjection);
app.use(rateLimiter);

const threatShield = new ApiThreatShield({
    honeypotUrl: 'http://localhost:3001',
    useGemini: true,
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    rateLimit: 50,
    sensitivePatterns: [
        /\bunion\s+select\b/i, 
    /\bexec\s*\(/i,
    /<script>/i,
    /\bdocument\.cookie\b/i,
    /\/etc\/passwd/i,
    /\.{3,}\//i, 
    /\$ne|gt|lt|in/i, 
    /(curl|wget|nc|bash|sh|python|perl)/i 
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


app.get('/admin/logs', (req, res) => {
    res.json(threatShield.getLogs());
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(` API server running on port ${PORT}`);
});

const honeypot = express();
honeypot.use(express.json());

honeypot.use((req, res, next) => {
    console.log(' Honeypot accessed:', {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        ip: req.ip
    });
    next();
});

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

const HONEYPOT_PORT = process.env.HONEYPOT_PORT || 3001;
honeypot.listen(HONEYPOT_PORT, () => {
    console.log(` Honeypot server running on port ${HONEYPOT_PORT}`);
});
