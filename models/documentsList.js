'use strict';
const {DynamoDB, ScanCommand} = require('@aws-sdk/client-dynamodb');

const IS_OFFLINE = process.env.IS_OFFLINE;
const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE;

module.exports =
  class DocumentList {

    initDb() {
      if (typeof this.dynamoDb === 'undefined') {
        if (IS_OFFLINE === 'true' || process.env.NODE_ENV === 'test') {
          this.dynamoDb = new DynamoDB({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
          })
        } else {
          this.dynamoDb = new DynamoDB({});
        }
      }
    }

    async getAll() {
      const params = {
        TableName: DOCUMENTS_TABLE,
      };

      if ( typeof this.dynamoDb === 'undefined') {
        this.initDb();
      }
      try {
        const data = await this.dynamoDb.send(new ScanCommand(params));
        return data.Items;
      } catch (e) {
        throw e;
      }
    }
  };
