'use strict';
const {DynamoDB, GetItemCommand, PutItemCommand} = require('@aws-sdk/client-dynamodb');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');
const {S3RequestPresigner} = require('@aws-sdk/s3-request-presigner');
const {createRequest} = require('@aws-sdk/util-create-request');
const {formatUrl} = require('@aws-sdk/util-format-url');
const {v1: uuidv1} = require('uuid');

const IS_OFFLINE = process.env.IS_OFFLINE;
const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;

module.exports =
  class Document {

    constructor({uuid = '', name = ''}) {
      this.uuid = uuid;
      this.name = name;
    }

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

    initS3Bucket() {
      if (typeof this.s3client === 'undefined') {
        if (IS_OFFLINE === 'true' || process.env.NODE_ENV === 'test') {
          this.s3client = new S3Client({
            region: 'localhost',
            endpoint: 'http://localhost:4569'
          })
        } else {
          this.s3client = new S3Client({});
        }
        this.initPresigner();
      }
    }

    initPresigner() {
      this.signedRequest = new S3RequestPresigner(this.s3client.config);
    }

    // DB management

    async loadFromDb() {
      this.initDb();

      if (this.uuid !== '') {
        const dbParams = {
          TableName: DOCUMENTS_TABLE,
          Key: {
            uuid: {S: this.uuid},
          },
        };

        try {
          const data = await this.dynamoDb.send(new GetItemCommand(dbParams));
          this.name = data.Item.name.S
        } catch (e) {
          throw e;
        }
      }
    }

    async addInDb() {
      this.initDb();

      if (typeof this.name !== 'undefined') {
        const params = {
          TableName: DOCUMENTS_TABLE,
          Item: {
            uuid: { S: uuidv1() },
            name: { S: this.name },
          },
        }

        try {
          await this.dynamoDb.send(new PutItemCommand(params));
        } catch (e) {
          throw e;
        }
      }
    }

    // Bucket management

    async getDownloadLink() {
      this.initS3Bucket();

      try {
        await this.loadFromDb();

        const s3clientParams = {
          Bucket: S3_BUCKET,
          Key: this.name,
        };
        const request = await createRequest(this.s3client, new GetObjectCommand(s3clientParams));
        return formatUrl(
          await this.signedRequest.presign(request, {
            expiresIn: 60 * 15,
          })
        );
      } catch (e) {
        throw e;
      }
    }

    async getUploadLink(fileType) {
      this.initS3Bucket()

      const clientParams = {
        Bucket: S3_BUCKET,
        Key: this.name,
        ContentType: fileType
      };

      try {
        const request = await createRequest(
          this.s3client,
          new PutObjectCommand(clientParams)
        );

        return formatUrl(
          await this.signedRequest.presign(request, {
            expiresIn: 60 * 60 * 24
          })
        );
      } catch (e) {
        throw e;
      }
    }

  };