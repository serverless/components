const chalk = require('chalk')

function logOutputs(ui, instances) {
  const instanceIds = Object.keys(instances)
  if (instanceIds.length) {
    instanceIds.forEach((instanceId) => {
      ui.log(chalk.rgb(0, 253, 88)(`${instanceId} outputs:`))
      ui.log()
      const outputs = Object.keys(instances[instanceId])
      // console.log(outputs)
      outputs.forEach((output) => {
        ui.output(output, instances[instanceId][output])
      })
    })
  }
}

module.exports = logOutputs
