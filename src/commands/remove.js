const run = require('../run')

async function remove(options) {
  return run('remove', options)
}

module.exports = remove
