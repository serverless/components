const crypto = require('crypto')

function getRandomId(length) {
  // TODO: length should determine size of randomBytes (rather than slicing at the end)
  return crypto
    .randomBytes(256)
    .toString('base64')
    .slice(0, length)
}

module.exports = getRandomId
