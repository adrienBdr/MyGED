const utils = require('../utils');
const Document = require('../models/document');
const DocumentList = require('../models/documentsList');

module.exports = {
  upload: async function (req, res) {
    const {
      fileName,
      fileType
    } = req.body;

    const document = new Document({name: fileName})

    try {
      return utils.resSuccess(res, {fileUrl: await document.getUploadLink(fileType)});
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
    try {
      return utils.resSuccess(res, await new DocumentList().getAll());
    } catch (err) {
      console.log(err);
      return utils.resError(res, 'Error while fetching database');
    }
  },

  download: async function (req, res) {
    const {
      uuid
    } = req.query;
    const document = new Document({uuid: uuid});

    try {
      return utils.resSuccess(res, {fileUrl: await document.getDownloadLink()});
    } catch (e) {
      console.log(e);
      return utils.resError(res, 'Error creating presigned URL');
    }
  }
};