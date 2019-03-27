require("dotenv").config();
const http = require('http');
const config = require('./config.json');


var bot = require('./bot');
require('./web')(bot);

setInterval(() => {
    http.get(config.app_url, {protocol: 'http:'}, response => console.log(`keep alive cycle : ${response.statusCode}`));
}, 5 * 60 * 1000);