function logOutputs(cli, outputs) {
  const instanceIds = Object.keys(outputs)
  if (instanceIds.length) {
    instanceIds.forEach((instanceId, idx) => {
      cli.outputs(outputs[instanceId], instanceId)
    })
  }
}

module.exports = logOutputs
