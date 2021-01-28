'use strict'
const app = require('./app');
const utils = require('./utils');

module.exports.app = app;

module.exports.postprocess = async (event) => {
  for (const record of event.Records) {
    await utils.addDocInDb(record.s3.object.key);
  }
};