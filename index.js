// Export the ApiThreatShield middleware
module.exports = require('./src/middleware/ApiThreatShield');

function fetchData(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error("Error:", error));
}

function sum(a, b) {
    return a + parseInt(b);
}

const userInput = "2 + 2";

console.log(sum(10, "5"));

fetchData("https://api.example.com/data");

console.log("Potato");