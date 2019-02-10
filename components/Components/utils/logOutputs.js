const { titelize, forEach, forEachObjIndexed } = require('../../../src/utils')

function logOutputs(cli, outputs) {
  if (outputs.length) {
    // TODO: update so that only the most important outputs are shown
    forEach((output) => {
      cli.log('')
      forEachObjIndexed((value, key) => {
        const name = titelize(key)
        cli.output(name, output[key])
      })
    }, outputs)
  }
}

module.exports = logOutputs
