const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const serverRoutes = require('../routes/documents.route');

const { postprocess } = require('../handlers');

const dbValues = {
  message: "success",
  data: [
    {
      name: {
        S: "adrien.jpg"
      },
      uuid: {
        S: "03dcf240-6158-11eb-9a92-e130c2c16bf3"
      }
    },
  ]
}

const mockedSuccessValues = {
  Items:
    [
      {
        "name": {
          "S": "adrien.jpg"
        },
        "uuid": {
          "S": "03dcf240-6158-11eb-9a92-e130c2c16bf3"
        }
      },
    ]
};

const mockedErrorValues = {
  message: "error",
  data: "Error while fetching database"
}

const mockedSuccessValue = {
  Item:
    {
      "name": {
        "S": "2021_SF_Consignes.pdf"
      },
      "uuid": {
        "S": "df273950-6180-11eb-9989-8d5774f200ea"
      }
    },
}

const mockedUrlErrorValues = {
  message: "error",
  data: "Error creating presigned URL"
}

const mockDynamoDBSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDB: jest.fn(() => ({
      send: mockDynamoDBSend
    })),
    ScanCommand: jest.fn(),
    GetItemCommand: jest.fn(),
    PutItemCommand: jest.fn()
  }
});

jest.mock("@aws-sdk/util-create-request", () => ({
  createRequest: jest.fn().mockResolvedValue({
    method: 'GET',
    hostname: 'localhost',
    port: 4569,
    query: {'x-id': 'GetObject'},
    headers: {
      host: 'localhost',
      'x-amz-user-agent': 'aws-sdk-js/3.3.0 os/linux/4.16.11-100.fc26.x86_64 lang/js md/nodejs/15.0.1 api/s3/3.3.0',
      'user-agent': 'aws-sdk-js/3.3.0'
    },
    body: undefined,
    protocol: 'http:',
    path: '/documents-s3bucket-dev/2021_SF_Consignes.pdf'
  }),
}));

const app = express();
app.use(bodyParser.json());
app.use('/document', serverRoutes);

describe('GET /document', () => {

  beforeEach(() => {
    mockDynamoDBSend.mockReset();
  });

  it("GET /document - Success : Values returned", async () => {
    mockDynamoDBSend.mockResolvedValue(mockedSuccessValues);
    const {body} = await request(app).get("/document"); //uses the request function that calls on express app instance
    expect(body).toEqual(dbValues);
  });

  it('GET /document - Error : No db return', async () => {
    const {body} = await request(app).get("/document"); //uses the request function that calls on express app instance
    expect(body).toEqual(mockedErrorValues);
  })
})

describe('GET /document/:uuid', () => {
  beforeEach(() => {
    mockDynamoDBSend.mockReset();
  });

  it('GET /document/:uuid - Success: url returned', async () => {
    mockDynamoDBSend.mockResolvedValue(mockedSuccessValue);
    const {body} = await request(app).get('/document?uuid=df273950-6180-11eb-9989-8d5774f200ea');
    expect(body.message).toEqual('success');
  })

  it("GET /document/:uuid - Error : No url created", async () => {
    mockDynamoDBSend.mockResolvedValue({Item: {}});
    const {body} = await request(app).get('/document?uuid=df273950-6180-11eb-9989-8d5774f200ea');
    expect(body).toEqual(mockedUrlErrorValues);
  })
})

describe('POST /document', () => {
  let params = {
    fileName: 'adrien.jpg',
    fileType: 'image/jpeg'
  }

  beforeEach(() => {
    mockDynamoDBSend.mockReset();
  });

  it('POST /document - Success : url returned', async () => {
    const {body} = await request(app).post("/document").send(params);
    expect(body.message).toEqual('success');
  })


  it('POST /document - Error : No params', async () => {
    const {body} = await request(app).post('/document').send({});
    expect(body).toEqual({
      message: 'error',
      data: [
        {msg: 'Invalid value', param: 'fileName', location: 'body'},
        {msg: 'fileName mandatory', param: 'fileName', location: 'body'},
        {msg: 'Invalid value', param: 'fileType', location: 'body'},
        {msg: 'fileType mandatory', param: 'fileType', location: 'body'}
      ]
    });
  })
})

describe('S3 ObjectCreated handler', () => {
  it('S3 ObjectCreated handler - Success : DynamoDB send called', async () => {
    postprocess({
      Records: [
        {
          s3: {
            object: {
              Key: "2021_SF_Consignes.pdf"
            }
          }
        }
      ]
    });

    expect(mockDynamoDBSend).toHaveBeenCalledTimes(1);
  })
})