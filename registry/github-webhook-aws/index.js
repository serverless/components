async function deploy(inputs, context) {
  return { ...inputs, ...context }
}

async function remove() {
  return {}
}

module.exports = {
  deploy,
  remove
}
