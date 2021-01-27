const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes')
const app = express();

app.use(bodyParser.json());

routes.forEach(route => {
  app.use(route.name, route.router);
});

module.exports.handler = serverless(app);