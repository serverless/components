const { createFunction, updateFunction, deleteFunction } = require('./utils')

// "public" functions
async function deploy(inputs, context) {
  const { functionId, functionType, url } = inputs

  let funcObj
  if (!Object.keys(context.state).length) {
    context.log(`Registering function "${functionId}" at Event Gateway "${url}"...`)
    funcObj = await createFunction(inputs)
  } else {
    context.log(
      `Updating function registration for function "${functionId}" at Event Gateway "${url}"...`
    )
    funcObj = await updateFunction(inputs)
  }

  const outputs = { functionId }
  const state = { ...funcObj, functionType, url }

  context.saveState(state)

  return outputs
}

async function remove(inputs, context) {
  const { functionId, url } = context.state

  context.log(
    `Removing function registration for function  "${functionId}" from Event Gateway "${url}"...`
  )

  await deleteFunction({ ...context.state, accessKey: inputs.accessKey })

  context.saveState()
  return {}
}

module.exports = {
  deploy,
  remove
}
