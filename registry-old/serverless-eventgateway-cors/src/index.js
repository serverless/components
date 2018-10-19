const { createCors, updateCors, deleteCors } = require('./utils')

// "public" functions
async function deploy(inputs, context) {
  const { method, path, url } = inputs

  let corsObj
  if (!Object.keys(context.state).length) {
    context.log(`Configuring CORS for "${method} ${path}" at Event Gateway "${url}"...`)
    corsObj = await createCors(inputs)
  } else {
    context.log(`Updating CORS configuration for "${method} ${path}" at Event Gateway "${url}"...`)
    corsObj = await updateCors({ ...context.state, accessKey: inputs.accessKey })
  }

  const outputs = { method, path, corsId: corsObj.corsId }
  const state = { ...corsObj, url }

  context.saveState(state)

  return outputs
}

async function remove(inputs, context) {
  const { method, path, url } = context.state

  context.log(`Removing CORS configuration for "${method} ${path}" from Event Gateway "${url}"...`)

  await deleteCors({ ...context.state, accessKey: inputs.accessKey })

  context.saveState()
  return {}
}

module.exports = {
  deploy,
  remove
}
