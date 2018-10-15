const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');
const keygrip = new Keygrip([keys.cookieKey]);

/**
 * Creates new session for user
 * @param user Mongoose User model instance
 */
module.exports = user => {
  // encode passport object in base64
  // to create session string
  const sessionObject = {
    passport: {
      user: user._id.toString()
    }
  };
  const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');

  // generate session signature
  // using cookie-parser's keygrip dependency
  const sig = keygrip.sign('session=' + session);

  return { session, sig };
};
