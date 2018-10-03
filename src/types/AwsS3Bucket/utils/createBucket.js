const createBucket = async ({ bucketName, provider }) => {
  const sdk = provider.getSdk()
  return sdk.createBucket({ Bucket: bucketName }).promise()
}

export default createBucket
