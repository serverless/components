/* eslint-disable no-console */

const AWS = require('aws-sdk')

const S3 = new AWS.S3({ region: 'us-east-1' })

async function createBucket({ name }) {
  return S3.createBucket({ Bucket: name }).promise()
}

async function deleteBucket({ name }) {
  const res = await S3.listObjectsV2({ Bucket: name }).promise()

  const objectsInBucket = []
  if (res) {
    res.Contents.forEach((object) => {
      objectsInBucket.push({
        Key: object.Key
      })
    })
  }

  if (objectsInBucket.length) {
    await S3.deleteObjects({
      Bucket: name,
      Delete: {
        Objects: objectsInBucket
      }
    }).promise()
  }

  return S3.deleteBucket({ Bucket: name }).promise()
}

async function deploy(inputs, context) {
  const { state } = context

  if (!state.name && inputs.name) {
    context.log(`Creating Bucket: '${inputs.name}'`)
    await createBucket(inputs)
    context.saveState({ name: inputs.name })
  } else if (state.name && inputs.name && state.name !== inputs.name) {
    context.log(`Removing Bucket: '${state.name}'`)
    await deleteBucket(context.state)
    context.log(`Creating Bucket: '${inputs.name}'`)
    await createBucket(inputs)
    context.saveState({ name: inputs.name })
  }

  const outputs = {
    name: inputs.name
  }
  return outputs
}

async function rollback(inputs, context) {
  const { archive, state } = context
  if (!archive.name && state.name) {
    context.log(`Removing Bucket: ${state.name}`)
    await deleteBucket(state)
  } else if (archive.name && !state.name) {
    context.log(`Creating Bucket: ${archive.name}`)
    await createBucket(archive)
  } else if (archive.name !== state.name) {
    context.log(`Removing Bucket: ${state.name}`)
    await deleteBucket(state)
    context.log(`Creating Bucket: ${archive.name}`)
    await createBucket(archive)
  }
  return archive
}

async function remove(inputs, context) {
  if (!context.state.name) return {}

  context.log(`Removing Bucket: '${context.state.name}'`)
  const outputs = {
    name: null
  }
  try {
    await deleteBucket(context.state)
  } catch (error) {
    if (!error.message.includes('The specified bucket does not exist')) {
      throw new Error(error)
    }
  }
  context.saveState(outputs)
  return outputs
}

module.exports = {
  deploy,
  remove,
  rollback
}
