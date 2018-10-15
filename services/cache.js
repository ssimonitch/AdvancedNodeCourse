const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
// redis node module doesnt natively support promises
// use Node lib promsify to wrap in Promise logic
client.hget = util.promisify(client.hget);

// monkey patch (overwrite) the mongoose query execution  function
const exec = mongoose.Query.prototype.exec;

// NOTE: must use function keyword to avoid implicit `this` binding
mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }
  // generate unique and consistent key from query contents
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );

  // Do we have any cached data in redis related to this query ?
  const cacheValue = await client.hget(this.hashKey, key);

  // If yes, return that
  if (cacheValue) {
    const document = JSON.parse(cacheValue);
    return Array.isArray(document) ? document.map(doc => new this.model(doc)) : new this.model(document);
  }

  // Otherwise, query MongoDB and store the result in Redis
  const result = await exec.apply(this, arguments);

  client.hset(this.hashKey, key, JSON.stringify(result));

  return result;
};

// add explicit cache function
mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');
  return this; // return instance so chaineable
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};
