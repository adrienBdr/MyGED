const validator = require('express-validator');

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

}