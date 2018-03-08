const deploy = async (inputs, context) => {
  const s3url = `http://${inputs.hosting_domain}.s3-website-${inputs.hosting_region}.amazonaws.com`

  if (!context.state.name && inputs.name) {
    context.log(`Creating site: ${inputs.name}`)
  } else if (!inputs.name && context.state.name) {
    context.log(`Removing site: ${context.state.name}`)
  } else if (context.state.name !== inputs.name) {
    context.log(`Removing old site: ${context.state.name}`)
    context.log(`Re-creating site: ${inputs.name}`)
  }
  const outputs = {
    url: s3url
  }
  context.saveState({ ...inputs, ...outputs })
  context.log(`Created site with url: ${s3url}`)
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing site: ${context.state.name}`)
  const outputs = {
    url: null
  }
  context.saveState()
  return outputs
}

module.exports = {
  deploy,
  remove
}
