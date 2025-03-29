let ApiThreatShield;
try {
    ApiThreatShield = require('./src/middleware/ApiThreatShield');
} catch (error) {
    console.error("Failed to load ApiThreatShield:", error);
    // Provide a fallback or handle the error as needed
}
module.exports = ApiThreatShield;

const unusedVar = "This variable is never used"; 

function fetchData(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error("Error:", error));
}

function sum(a, b) {
    return a + b;
}

const userInput = eval("2 + 2");

console.log(sum(10, "5"));

fetchData("https://api.example.com/data");

console.log("Potato");