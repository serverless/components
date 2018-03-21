/* eslint-disable no-console */

const deploy = async (inputs, context) => {
  let outputs = context.state

  // TODO: I need the generated child bucket ID to construct the real URL to return up the chain.
  const s3url = `http://${inputs.hostingDomain}.s3-website-${inputs.hostingRegion}.amazonaws.com`

  if (!context.state.name && inputs.name) {
    context.log(`Creating Site: '${inputs.name}'`)
    outputs = {
      url: s3url
    }
  } else if (!inputs.name && context.state.name) {
    context.log(`Removing Site: '${context.state.name}'`)
    outputs = {
      url: null
    }
  } else if (context.state.name !== inputs.name) {
    context.log(`Removing old Site: '${context.state.name}'`)
    context.log(`Creating new Site: '${inputs.name}'`)
    outputs = {
      url: s3url
    }
  }
  context.saveState({ ...inputs, ...outputs })
  // TODO uncomment and log out real URL when we get it context.log(`Created Site with url: '${s3url}'`)
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.name) return {}

  context.log(`Removing Site: '${context.state.name}'`)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
