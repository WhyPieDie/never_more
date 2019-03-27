require("dotenv").config();
const http = require('http');
const config = require('./config.json');


var bot = require('./bot');
require('./web')(bot);

setInterval(() => {
    http.get(config.app_url)
}, 5 * 60 * 1000);