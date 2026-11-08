const api = require('../ai/api');
const { post } = require('../ai/http');

module.exports = post(ctx => api.illustrate(ctx));
