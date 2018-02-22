const AWS = require('aws-sdk')

const S3 = new AWS.S3({ region: 'us-east-1' })

const createBucket = async (name) => {
  const res = await S3.createBucket({ Bucket: name }).promise()

  return {
    name,
    location: res.Location
  }
}

const deleteBucket = async (name) => {
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

  await S3.deleteBucket({ Bucket: name }).promise()

  return {
    name: null,
    location: null
  }
}

const deploy = async (inputs, state, context) => {
  let outputs = {}
  if (!state.name && inputs.name) {
    context.log(`Creating Bucket: ${inputs.name}`)
    outputs = await createBucket(inputs.name)
  } else if (!inputs.name && state.name) {
    context.log(`Removing Bucket: ${state.name}`)
    outputs = await deleteBucket(state.name)
  } else if (state.name !== inputs.name) {
    context.log(`Removing Bucket: ${state.name}`)
    await deleteBucket(state.name)
    context.log(`Creating Bucket: ${inputs.name}`)
    outputs = await createBucket(inputs.name)
  }
  return outputs
}

const remove = async (inputs, state, context) => {
  context.log(`Removing Bucket: ${state.name}`)
  const outputs = await deleteBucket(state.name)
  return outputs
}

module.exports = {
  deploy,
  remove
}
