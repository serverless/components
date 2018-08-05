const run = require('../run')
async function decrypt(options) {
  return run('decrypt', options)
}
module.exports = decrypt
