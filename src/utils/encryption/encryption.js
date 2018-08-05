const crypto = require('crypto')

const toBuffer = (value) => (value instanceof Buffer ? value : Buffer.from(value))

const encrypt = (cipher_alg, key, iv, text, encoding = 'binary') => {
  const cipher = crypto.createCipheriv(cipher_alg, toBuffer(key), toBuffer(iv))
  let result = cipher.update(text, 'utf8', encoding)
  result += cipher.final(encoding)
  return result
}

const decrypt = (cipher_alg, key, iv, text, encoding = 'binary') => {
  const decipher = crypto.createDecipheriv(cipher_alg, toBuffer(key), toBuffer(iv))
  let result = decipher.update(text, encoding)
  result += decipher.final()
  return result
}

module.exports = {
  encrypt,
  decrypt
}
