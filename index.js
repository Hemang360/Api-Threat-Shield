// Export the ApiThreatShield middleware
module.exports = require('./src/middleware/ApiThreatShield');

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

console.log(sum(10, parseInt("5")));

fetchData("https://api.example.com/data");

console.log("Potato");
console.log("Shreyas");