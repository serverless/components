const deploy = async (inputs, state, context) => {
  const s3url = `http://${inputs.hosting_domain}.s3-website-${inputs.hosting_region}.amazonaws.com`

  if (!state.name && inputs.name) {
    context.log(`Creating site: ${inputs.name}`)
  } else if (!inputs.name && state.name) {
    context.log(`Removing site: ${state.name}`)
  } else if (state.name !== inputs.name) {
    context.log(`Removing old site: ${state.name}`)
    context.log(`Re-creating site: ${inputs.name}`)
  }
  const outputs = {
    url: s3url
  }
  context.log(`Created site with url: ${s3url}`)
  return outputs
}

const remove = async (inputs, state, context) => {
  context.log(`Removing site: ${state.name}`)
  const outputs = {
    url: null
  }
  return outputs
}

module.exports = {
  deploy,
  remove
}
