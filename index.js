// Export the ApiThreatShield middleware
module.exports = require('./src/middleware/ApiThreatShield');
// sample.js - Contains issues like unused variables, insecure code, and bad practices

function fetchData(url) {
    fetch(url) // Missing error handling
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }) // No validation for JSON response
        .then(data => console.log(data))
        .catch(error => console.error("Error:", error));
}

function sum(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new TypeError('sum function requires number types');
    }
    return a + b; // No type checking
}

const userInput = parseInt("2 + 2"); // Security issue: Use of eval()

console.log(sum(10, parseInt("5"))); // Potential bug: String concatenation instead of number addition

fetchData("https://api.example.com/data");

console.log("Potato");
console.log("Shreyas");