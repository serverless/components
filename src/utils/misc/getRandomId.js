const crypto = require('crypto-extra')

function getRandomId(length) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  return crypto.randomString(length, alphabet)
}

module.exports = getRandomId
