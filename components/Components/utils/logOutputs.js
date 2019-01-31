const { forEach } = require('@serverless/utils')
const { titelize } = require('../../../src/utils')

function logOutputs(cli, outputs) {
  // TODO: update so that only the most important outputs are shown
  forEach((output) => {
    cli.log('')
    forEach((value, key) => {
      const name = titelize(key)
      cli.output(name, value)
    }, output)
  }, outputs)
}

module.exports = logOutputs
