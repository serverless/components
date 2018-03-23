const crypto = require('crypto-extra')

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

function getRandomId(length) {
  return crypto.randomString(length, ALPHABET)
}

module.exports = getRandomId
