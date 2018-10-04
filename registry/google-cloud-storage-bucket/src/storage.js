const { Storage } = require('@google-cloud/storage')

const createBucket = async (inputs) => {
  const storage = new Storage({
    projectId: inputs.project
  })

  return await storage
    .createBucket(inputs.name, inputs)
    .then((bucket) => {
      return bucket[0].metadata
    })
    .catch((err) => {
      throw new Error(`failed to create bucket: ${err}`)
    })
}

const getBucketMetadata = async (inputs) => {
  // Creates a client
  const storage = new Storage({
    projectId: inputs.project
  })

  return await storage
    .bucket(inputs.name)
    .getMetadata()
    .then((data) => data[0])
    .catch((err) => {
      throw new Error(`failed to get bucket metadata: ${err}`)
    })
}

const deleteBucket = async (inputs) => {
  // Creates a client
  const storage = new Storage({
    projectId: inputs.project
  })

  return await storage
    .bucket(inputs.name)
    .delete()
    .then(() => {
      return { name: inputs.name }
    })
    .catch((err) => {
      throw new Error(`failed to delete bucket: ${err}`)
    })
}

module.exports = {
  createBucket,
  deleteBucket,
  getBucketMetadata
}
