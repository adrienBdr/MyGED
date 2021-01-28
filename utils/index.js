const validator = require('express-validator');
const {DynamoDBClient, PutItemCommand} = require('@aws-sdk/client-dynamodb');
const {v1: uuidv1} = require('uuid');

const IS_OFFLINE = process.env.IS_OFFLINE;
const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE;

module.exports = {
  respond: function (res, status, body) {
    return res.status(status).json(body);
  },

  resSuccess: function (res, data, message = 'success', status = 200) {
    return module.exports.respond(res, status, {message: message, data: data});
  },

  resError: function (res, data, status = 400, message = 'error') {
    return module.exports.respond(res, status, {message: message, data: data});
  },

  validate: function (req, res, next) {
    const errs = validator.validationResult(req);

    if (!errs.isEmpty()) {
      return module.exports.resError(res, errs.array());
    }
    next();
  },

  addDocInDb: async function (name) {
    let dynamoDb;
    if (IS_OFFLINE === 'true') {
      dynamoDb = await new DynamoDBClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    } else {
      dynamoDb = await new DynamoDBClient({});
    }

    const params = {
      TableName: DOCUMENTS_TABLE,
      Item: {
        uuid: { S: uuidv1() },
        name: { S: name },
      },
    }

    try {
      await dynamoDb.send(new PutItemCommand(params));
    } catch (e) {
      console.log(e);
    }
  }
}