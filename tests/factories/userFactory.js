const mongoose = require('mongoose');
const User = mongoose.model('User');

/**
 * Creates and returns new Mongo user
 */
module.exports = () => {
  return new User({}).save();
};
