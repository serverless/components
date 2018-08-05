const run = require('../run')
async function encrypt(options) {
  return run('encrypt', options)
}
module.exports = encrypt
