const deploy = (inputs, context) => {
  context.saveState({ inputs })
  return {}
}

const remove = (inputs, context) => {
  context.saveState({})
}

module.exports = {
  deploy,
  remove
}
