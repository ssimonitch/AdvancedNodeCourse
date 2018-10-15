const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
  await next(); // call route handler first
  clearHash(req.user.id) // then clear cache so can rebuild on next fetch
};