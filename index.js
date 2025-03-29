// Export the ApiThreatShield middleware
module.exports = require('./src/middleware/ApiThreatShield');
// sample.js - Contains issues like unused variables, insecure code, and bad practices

const Joi = require('joi');

function fetchData(url) {
    const schema = Joi.string().uri();
    const { error } = schema.validate(url);
    if (error) {
        console.error("Invalid URL:", error.details[0].message);
        return;
    }

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
    const num1 = Number(a);
    const num2 = Number(b);
    if (isNaN(num1) || isNaN(num2)) {
        console.error("Invalid input: Please provide numbers.");
        return;
    }
    return num1 + num2; // No type checking
}

const userInput = JSON.parse("2 + 2"); // Security issue: Use of eval()

console.log(sum(10, "5")); // Potential bug: String concatenation instead of number addition

fetchData("https://api.example.com/data");

console.log("Potato");
console.log("Shreyas");