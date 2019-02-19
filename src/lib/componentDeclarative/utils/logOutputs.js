const os = require('os')
const chalk = require('chalk')
const figures = require('figures')
const { titelize, forEachObjIndexed } = require('../../../utils')

function logOutputs(cli, outputs) {
  const instanceIds = Object.keys(outputs)
  if (instanceIds.length) {
    cli.log()
    instanceIds.forEach((instanceId, idx) => {

      cli.log(`${chalk.green(figures.tick)}  ${instanceId}`)
      if (idx > 0) cli.log() // Temp workaround to make spacing consistent

      forEachObjIndexed((value, key) => {
        const name = titelize(key)
        // only log non-object values for now
        if (typeof value !== 'object') {
          cli.output(`   ${name}`, value)
        }
      }, outputs[instanceId])

      // determine if a newline needs to be logged
      if ((idx += 1) !== instanceIds.length) {
        cli.log()
      }
    })
  }
}

module.exports = logOutputs
