const deleteBucket = async ({ bucketName, provider }) => {
  try {
    const sdk = provider.getSdk()
    const res = await sdk.listObjectsV2({ Bucket: bucketName }).promise()

    const objectsInBucket = []
    if (res) {
      res.Contents.forEach((object) => {
        objectsInBucket.push({
          Key: object.Key
        })
      })
    }

    if (objectsInBucket.length) {
      await sdk
        .deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: objectsInBucket
          }
        })
        .promise()
    }

    return sdk.deleteBucket({ Bucket: bucketName }).promise()
  } catch (error) {
    if (!error.message.includes('The specified bucket does not exist')) {
      throw error
    }
  }
}

export default deleteBucket
