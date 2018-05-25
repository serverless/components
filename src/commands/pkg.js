const run = require('../run')

async function pkg(options) {
  return run('package', options)
}

module.exports = pkg
