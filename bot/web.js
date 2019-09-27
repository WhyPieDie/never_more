const express = require('express');
const bodyParser = require('body-parser');
const packageInfo = require('./package.json');
const config = require('./config.json');
const db = require('./db');


const app = express();
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.json(200, { version: packageInfo.version });
});

app.get('/phrases', async function (req, res) {
  let db_uri = config.db_uri_template
    .replace('$user', config.db_user)
    .replace('$password', config.db_password);
  let database = new db(db_uri, config.db_name, config.db_collection);
  let collection = await database.get_collection();
  let phrases = await database.get_phrases(collection)
  res.json( {phrases : phrases});
})

var server = app.listen(process.env.PORT, "0.0.0.0", () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Web server started at http://%s:%s', host, port);
});

module.exports = (bot) => {
  app.post('/' + bot.token, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
};