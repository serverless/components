const deleteBucket = async ({ bucketName, provider }) => {
  const SDK = provider.getSdk()
  const s3 = new SDK.S3()
  try {
    const res = await s3.listObjectsV2({ Bucket: bucketName }).promise()

    const objectsInBucket = []
    if (res) {
      res.Contents.forEach((object) => {
        objectsInBucket.push({
          Key: object.Key
        })
      })
    }

    if (objectsInBucket.length) {
      await s3
        .deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: objectsInBucket
          }
        })
        .promise()
    }

    return s3.deleteBucket({ Bucket: bucketName }).promise()
  } catch (error) {
    if (!error.message.includes('The specified bucket does not exist')) {
      throw error
    }
  }
}

export default deleteBucket
