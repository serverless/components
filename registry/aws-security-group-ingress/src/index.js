// aws-security-group-ingress

const deploy = async (inputs, context) => {
  const { state } = context
  context.log(JSON.stringify({ inputs, state }, null, 2))
  return {}
}

const remove = async () => {
  return {}
}

module.exports = {
  deploy,
  remove
}
