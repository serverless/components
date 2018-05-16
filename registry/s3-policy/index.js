/* eslint-disable no-console */

const AWS = require('aws-sdk')

const S3 = new AWS.S3({ region: 'us-east-1' })

const setPolicyAndCors = async ({ bucketName }) => {
  const s3BucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          AWS: '*'
        },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
      }
    ]
  }

  await S3.putBucketPolicy({
    Bucket: bucketName,
    Policy: JSON.stringify(s3BucketPolicy)
  }).promise()

  // configure CORS
  const putPostDeleteHeadRule = {
    AllowedMethods: ['PUT', 'POST', 'DELETE', 'HEAD'],
    AllowedOrigins: ['https://*.amazonaws.com'],
    AllowedHeaders: ['*'],
    MaxAgeSeconds: 0
  }

  const getRule = {
    AllowedMethods: ['GET'],
    AllowedOrigins: ['*'],
    AllowedHeaders: ['*'],
    MaxAgeSeconds: 0
  }

  await S3.putBucketCors({
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [putPostDeleteHeadRule, getRule]
    }
  }).promise()
  console.log(`Set policy and CORS for bucket '${bucketName}'`)

  return {}
}

const unsetPolicyAndCors = async (bucketName) => {
  await S3.deleteBucketPolicy({
    Bucket: bucketName
  }).promise()

  await S3.deleteBucketCors({
    Bucket: bucketName
  }).promise()
  console.log(`Removed policy and CORS for bucket '${bucketName}'.`)

  return {}
}

const deploy = async (inputs, context) => {
  if (!context.state.bucketName && inputs.bucketName) {
    context.log(`Setting policy for bucket: '${inputs.bucketName}'`)
    await setPolicyAndCors(inputs)
  } else if (!inputs.bucketName && context.state.bucketName) {
    context.log(`Removing policy for bucket: '${context.state.bucketName}'`)
    await unsetPolicyAndCors(context.state.bucketName)
  } else if (context.state.bucketName !== inputs.bucketName) {
    context.log(`Removing policy for bucket: '${context.state.bucketName}'`)
    await unsetPolicyAndCors(context.state.bucketName)
    context.log(`Setting policy for bucket: '${inputs.bucketName}'`)
    await setPolicyAndCors(inputs)
  }
  context.saveState({ ...inputs })
  return inputs
}

const remove = async (inputs, context) => {
  if (!context.state.bucketName) return {}

  try {
    context.log(`Removing policy for bucket: '${context.state.bucketName}'`)
    await unsetPolicyAndCors(context.state.bucketName)
  } catch (e) {
    if (!e.message.includes('The specified bucket does not exist')) {
      throw new Error(e)
    }
  }

  context.saveState({})

  return {}
}

module.exports = {
  deploy,
  remove
}
