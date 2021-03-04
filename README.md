# MyGED
API Serverless de Gestion Electronique de Document (GED)

Stack :

- NodeJS
- Serverless Framework
- Lambda
- API Gateway
- S3
- DynamoDB
- Jest

All the uploaded documents are stocked in S3 and referenced by DynamoDB.

Endpoints:
- GET /documents List documents
- POST /documents return a pre-signed url from s3 to upload a file
- GET /documents/:uuid return a pre-signed url from s3 to download a file

