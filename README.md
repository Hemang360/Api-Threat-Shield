# api-threat-shield

`api-threat-shield` is an npm package designed to detect and block attacks on APIs. It acts as middleware for Express applications, providing security by identifying malicious requests and mitigating potential threats.

## Features

- **Real-time Threat Detection**: Monitors incoming API requests for malicious activity.
- **Honeypot Integration**: Redirects attackers to a honeypot for further tracking.
- **AI-Powered Analysis**: Uses Google Gemini AI to enhance threat detection.
- **Easy Integration**: Simple middleware setup for Express applications.

## Installation

Install `api-threat-shield` via npm:

```sh
npm install api-threat-shield

``` Steps to integrate api-threat-shield into your Express app:
const express = require('express');
const ApiThreatShield = require('api-threat-shield');

const app = express();
app.use(express.json());

const threatShield = new ApiThreatShield({
  honeypotUrl: 'http://localhost:3001', // URL of your honeypot server
  useGemini: true, // Enable AI-based threat detection
  geminiApiKey: 'YOUR_GEMINI_API_KEY' // Your Gemini API key
});

app.use(threatShield.middleware());

// Your API routes
app.get('/', (req, res) => {
  res.send('API is running securely.');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
