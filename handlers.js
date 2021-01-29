'use strict'
const app = require('./app');
const Document = require('./models/document');

module.exports.app = app;

module.exports.postprocess = async (event) => {
  for (const record of event.Records) {
    const document = new Document({name: record.s3.object.key});

    try {
      await document.addInDb();
    } catch (e) {
      console.log(e);
    }
  }
};