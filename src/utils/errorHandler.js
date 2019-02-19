const cli = require('../lib/cli')

/**
 * Logs formatted errors and exits with the right code
 * @param {Error} error - A standard javascript error object
 */

const errorHandler = (error) => {
  cli.renderError(error)
  process.exit(1)
}

module.exports = errorHandler
