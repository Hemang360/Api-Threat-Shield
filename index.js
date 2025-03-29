// Export the ApiThreatShield middleware
module.exports = require('./src/middleware/ApiThreatShield');
// sample.js - Contains issues like unused variables, insecure code, and bad practices

const unusedVar = "This variable is never used"; // Unused variable

function fetchData(url) {
    fetch(url) // Missing error handling
        .then(response => response.json()) // No validation for JSON response
        .then(data => console.log(data))
        .catch(error => console.error("Error:", error));
}

function sum(a, b) {
    return a + b; // No type checking
}

const userInput = eval("2 + 2"); // Security issue: Use of eval()

console.log(sum(10, "5")); // Potential bug: String concatenation instead of number addition

fetchData("https://api.example.com/data");

console.log("Potato");;
console.log(Shreyas);