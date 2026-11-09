const api = require('../ai/api');
const { get } = require('../ai/http');

module.exports = get(q => api.streetview(q));
