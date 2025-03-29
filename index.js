// Export the ApiThreatShield middleware
module.exports = require('./src/middleware/ApiThreatShield');
// sample.js - Contains issues like unused variables, insecure code, and bad practices

function fetchData(url) {
    fetch(url) // Added error handling
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }) // Added validation for JSON response
        .then(data => console.log(data))
        .catch(error => console.error("Error:", error));
}

function sum(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new TypeError('Both arguments must be numbers');
    }
    return a + b; // Added type checking
}

const userInput = JSON.parse("2 + 2"); // Fixed security issue: Replaced eval() with JSON.parse()

console.log(sum(10, parseInt("5", 10))); // Fixed potential bug: Ensured string is converted to number

fetchData("https://api.example.com/data");