const deploy = (inputs, context) => {
  context.saveState({ inputs })
  context.setOutputs({})
}

const remove = (inputs, context) => {
  context.saveState({})
  context.setOutputs({})
}

module.exports = {
  deploy,
  remove
}
