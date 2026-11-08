// Served at /api/ai/status — the path the client already asks for.
const api = require('../../ai/api');
const { send } = require('../../ai/http');

module.exports = async (req, res) => {
  send(res, await api.status({ models: /[?&]models=1\b/.test(req.url || '') }));
};
