const { titelize, forEach, forEachObjIndexed } = require('../../../src/utils')

function logOutputs(cli, outputs) {
  const instanceIds = Object.keys(outputs)
  if (instanceIds.length) {
    forEach((instanceId) => {
      cli.log('')
      cli.log(instanceId)
      forEachObjIndexed((value, key) => {
        const name = titelize(key)
        // only log non-object values for now
        if (typeof value !== 'object') {
          cli.output(`  ${name}`, value)
        }
      }, outputs[instanceId])
    }, instanceIds)
  }
}

module.exports = logOutputs
