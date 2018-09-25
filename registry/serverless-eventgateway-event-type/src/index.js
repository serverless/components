const { createEventType, updateEventType, deleteEventType } = require('./utils')

// "public" functions
async function deploy(inputs, context) {
  const { name, url } = inputs

  let eventTypeObj
  if (!Object.keys(context.state).length) {
    context.log(`Registering event type "${name}" at Event Gateway "${url}"...`)
    eventTypeObj = await createEventType(inputs)
  } else {
    context.log(`Updating event type "${name}" at Event Gateway "${url}"...`)
    eventTypeObj = await updateEventType(inputs)
  }

  const outputs = { name }
  const state = { ...eventTypeObj, url }

  context.saveState(state)

  return outputs
}

async function remove(inputs, context) {
  const { name, url } = context.state

  context.log(`Removing event type "${name}" from Event Gateway "${url}"...`)

  await deleteEventType({ ...context.state, accessKey: inputs.accessKey })

  context.saveState()
  return {}
}

module.exports = {
  deploy,
  remove
}
