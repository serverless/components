async function deploy(inputs, context) {
  context.setOutputs({ ...inputs, ...context })
}

async function remove(inputs, context) {
  context.setOutputs({})
}

module.exports = {
  deploy,
  remove
}
