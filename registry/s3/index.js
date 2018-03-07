const AWS = require('aws-sdk')

const S3 = new AWS.S3({ region: 'us-east-1' })

const createBucket = async (name) => S3.createBucket({ Bucket: name }).promise()

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

  return S3.deleteBucket({ Bucket: name }).promise()
}

const deploy = async (inputs, context) => {
  if (!context.state.name && inputs.name) {
    context.log(`Creating Bucket: ${inputs.name}`)
    await createBucket(inputs.name)
  } else if (!inputs.name && context.state.name) {
    context.log(`Removing Bucket: ${context.state.name}`)
    await deleteBucket(context.state.name)
  } else if (context.state.name !== inputs.name) {
    context.log(`Removing Bucket: ${context.state.name}`)
    await deleteBucket(context.state.name)
    context.log(`Creating Bucket: ${inputs.name}`)
    await createBucket(inputs.name)
  }
  const outputs = {
    name: inputs.name
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing Bucket: ${context.state.name}`)
  await deleteBucket(context.state.name)
  const outputs = {
    name: null
  }
  context.saveState()
  return outputs
}

module.exports = {
  deploy,
  remove
}
