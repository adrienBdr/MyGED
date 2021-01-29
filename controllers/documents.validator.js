const validator = require('express-validator');
const utils = require('../utils');

module.exports = {
  upload: [
    validator.body('fileName').exists().isLength({min: 1}).withMessage('fileName mandatory'),
    validator.body('fileType').exists().isLength({min: 1}).withMessage('fileType mandatory'),
    utils.validate
  ],
}