const storage = require('./storage')

const deploy = async (inputs, context) => {
  const { state } = context

  if (!state.name && inputs.name) {
    context.log(`Creating Bucket: '${inputs.name}'`)
    // Handle existing buckets without throwing an error.
    try {
      const result = await storage.createBucket(inputs)
      if (!!result) {
        context.saveState(result)
      }
      return result || {}
    } catch (e) {
      const msg = 'You already own this bucket. Please select another name.'
      if (!e.message.includes(msg)) {
        throw e
      } else {
        context.log(msg)
      }
    }
  } else if (state.name && inputs.name && state.name !== inputs.name) {
    context.log(`Removing Bucket: '${state.name}'`)
    await storage.deleteBucket(state)
    context.log(`Creating Bucket: '${inputs.name}'`)
    const result = await storage.createBucket(inputs)
    if (!!result) {
      context.saveState(result)
    }

    return result || {}
  }

  return await storage.getBucketMetadata(inputs)
}

const remove = async (inputs, context) => {
  if (!context.state.name) return {}

  try {
    context.log(`Removing Bucket: '${context.state.name}'`)
    await storage.deleteBucket(inputs)
  } catch (e) {
    if (!e.message.includes('Not Found')) {
      throw new Error(e)
    }
  }

  context.saveState({})
  return {
    name: null
  }
}

const info = async (inputs, context) => {
  const bucket = await storage.getBucketMetadata(inputs)
  context.log(`gs://${bucket.id}`)
  return bucket
}

module.exports = {
  deploy,
  remove,
  info
}
