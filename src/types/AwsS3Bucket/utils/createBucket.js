const createBucket = async ({ bucketName, provider }) => {
  const SDK = provider.getSdk()
  const s3 = new SDK.S3()
  return s3.createBucket({ Bucket: bucketName }).promise()
}

export default createBucket
