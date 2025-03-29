// Export the ApiThreatShield middleware
module.exports = require('./src/middleware/ApiThreatShield');
// sample.js - Contains issues like unused variables, insecure code, and bad practices

function fetchData(url) {
    fetch(url) // Missing error handling
        .then(response => response.json()) // No validation for JSON response
        .then(data => console.log(data))
        .catch(error => console.error("Error:", error));
}

function sum(a, b) {
    return a + b; // No type checking
}

fetchData("https://api.example.com/data");

console.log("Potato");