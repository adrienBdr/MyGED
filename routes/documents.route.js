const express = require('express');
const validator = require('../controllers/documents.validator');
const controller = require('../controllers/documents.controller');

const router = express.Router();

router.route('/')
  .post(validator.upload, controller.upload)
  .get(controller.get);

module.exports = router;