const {DynamoDB, ScanCommand, GetItemCommand} = require('@aws-sdk/client-dynamodb');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');
const {S3RequestPresigner} = require('@aws-sdk/s3-request-presigner');
const {createRequest} = require('@aws-sdk/util-create-request');
const {formatUrl} = require('@aws-sdk/util-format-url');
const utils = require('../utils');

const IS_OFFLINE = process.env.IS_OFFLINE;
const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;

let dynamoDb, s3client;
if (IS_OFFLINE === 'true') {
  dynamoDb = new DynamoDB({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  s3client = new S3Client({
    region: 'localhost',
    endpoint: 'http://localhost:4569'
  })
  console.log(dynamoDb);
  console.log(s3client);
} else {
  dynamoDb = new DynamoDB({});
  s3client = new S3Client({});
}

const signedRequest = new S3RequestPresigner(s3client.config);

module.exports = {
  upload: async function (req, res) {
    const {
      fileName,
      fileType
    } = req.body;

    const clientParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
      ContentType: fileType
    };

    try {
      const request = await createRequest(
        s3client,
        new PutObjectCommand(clientParams)
      );

      const signedUrl = formatUrl(
        await signedRequest.presign(request, {
          expiresIn: 60 * 60 * 24
        })
      );

      return utils.resSuccess(res, {url: signedUrl});
    } catch (e) {
      return utils.resError(res, 'Error creating presigned URL')
    }
  },

  get: async function (req, res) {
    if (req.query.uuid) {
      return module.exports.download(req, res);
    }
    return module.exports.list(req, res);
  },

  list: async function (req, res) {
    const params = {
      TableName: DOCUMENTS_TABLE,
    };

    try {
      const data = await dynamoDb.send(new ScanCommand(params));
      return utils.resSuccess(res, data.Items);
    } catch (err) {
      console.log(err);
      return utils.resError(res, 'Error while fetching database');
    }
  },

  download: async function (req, res) {
    const {
      uuid
    } = req.query;

    const dbParams = {
      TableName: DOCUMENTS_TABLE,
      Key: {
        uuid: { S: uuid },
      },
    };

    try {
      const data = await dynamoDb.send(new GetItemCommand(dbParams));
      const s3clientParams = {
        Bucket: S3_BUCKET,
        Key: data.Item.name.S,
      };
      console.log(data);
      const request = await createRequest(s3client, new GetObjectCommand(s3clientParams));
      const signedUrl = formatUrl(
        await signedRequest.presign(request, {
          expiresIn: 60 * 15,
        })
      );
      return utils.resSuccess(res, {fileUrl: signedUrl});
    } catch (e) {
      console.log(e);
      return utils.resError(res, 'Error creating presigned URL');
    }
  }
};