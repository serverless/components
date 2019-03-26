const cli = require('../lib/cli')

/**
 * Logs formatted errors and exits with the right code
 * @param {Error} error - A standard javascript error object
 */

const errorHandler = (error, entity) => {
  if (typeof error === 'string') error = new Error(error)
  cli.renderError(error, entity)
  cli.close('error', error)
}

module.exports = errorHandler
