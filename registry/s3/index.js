const AWS = require('aws-sdk')

const S3 = new AWS.S3({ region: 'us-east-1' })

const create = async (name) => {
  const res = await S3.createBucket({ Bucket: name }).promise()

  return {
    name,
    location: res.Location
  }
}

const remove = async (name) => {
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

module.exports = async (inputs, state) => {
  let outputs
  if (!state.name && inputs.name) {
    console.log(`Creating Bucket: ${inputs.name}`)
    outputs = await create(inputs.name)
  } else if (!inputs.name && state.name) {
    console.log(`Removing Bucket: ${state.name}`)
    outputs = await remove(state.name)
  } else if (state.name !== inputs.name) {
    console.log(`Removing Bucket: ${state.name}`)
    await remove(state.name)
    console.log(`Creating Bucket: ${inputs.name}`)
    outputs = await create(inputs.name)
  }
  return outputs
}
