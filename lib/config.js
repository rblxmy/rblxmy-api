// config.js
const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    apiKey: process.env.API_KEY,
    ROBLOSECURITY: process.env.ROBLOSECURITY,
};