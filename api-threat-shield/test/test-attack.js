// test/test-attack.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const apiUrl = 'http://localhost:4000';
const logFile = path.join(__dirname, 'attack-results.log');

async function testAttacks() {
    console.log('🧪 Running attack tests...');
    let logData = `\n=== Attack Test - ${new Date().toISOString()} ===\n`;

    const attackCases = [
        { type: 'SQL Injection', url: `${apiUrl}/api/users?id=1 UNION SELECT username,password FROM users` },
        { type: 'XSS', url: `${apiUrl}/api/data`, method: 'post', data: { name: '<script>alert(1)</script>' } },
        { type: 'Path Traversal', url: `${apiUrl}/api/users?file=../../../etc/passwd` },
        { type: 'RCE', url: `${apiUrl}/api/data`, method: 'post', data: { command: 'cat /etc/passwd' } }
    ];

    for (const attack of attackCases) {
        try {
            const response = await axios({
                method: attack.method || 'get',
                url: attack.url,
                data: attack.data || {}
            });

            const isBlocked = response.status === 302 || response.data?.redirected;
            const result = isBlocked ? 'Blocked 🚫' : 'Allowed ⚠️';

            console.log(`✅ ${attack.type} test: ${result}`);
            logData += `[${attack.type}] ${attack.url} -> ${result}\n`;
        } catch (error) {
            console.error(`❗ ${attack.type} test error:`, error.message);
            logData += `[${attack.type}] ${attack.url} -> ERROR: ${error.message}\n`;
        }
    }

    fs.appendFileSync(logFile, logData);
    console.log('📝 Results logged in attack-results.log');
}

testAttacks();
