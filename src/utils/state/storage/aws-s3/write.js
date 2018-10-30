import AWS from 'aws-sdk'

const removeLock = async (config) => {
  const s3 = new AWS.S3({ region: 'us-east-1' })
  try {
    await s3
      .deleteObject({
        Bucket: config.state.bucket,
        Key: `${config.state.file}.lock`
      })
      .promise()
  } catch (error) {
    if (error.statusCode !== 404) {
      throw error
    }
  }
}

const writeObject = async (config, content) => {
  const s3 = new AWS.S3({ region: 'us-east-1' })
  return s3
    .putObject({
      Bucket: config.state.bucket,
      Key: config.state.file,
      Body: JSON.stringify(content)
    })
    .promise()
}

const write = async (config, content) => {
  await removeLock(config)
  return writeObject(config, content)
}

export default write
