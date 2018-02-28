const AWS = require('aws-sdk')
const BbPromise = require('bluebird')

const S3 = new AWS.S3({ region: 'us-east-1' })

const setPolicyAndCors = async ({bucketName}) => {
  const s3BucketPolicy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: {
        AWS: '*'
      },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${bucketName}/*`]
    }]
  }

  const policyRes = await S3.putBucketPolicy({
    Bucket: bucketName,
    Policy: JSON.stringify(s3BucketPolicy)
  }).promise()

  // configure CORS
  const putPostDeleteHeadRule = {
    AllowedMethods: [
      'PUT',
      'POST',
      'DELETE',
      'HEAD'
    ],
    AllowedOrigins: [
      'https://*.amazonaws.com'
    ],
    AllowedHeaders: [
      '*'
    ],
    MaxAgeSeconds: 0
  }

  const getRule = {
    AllowedMethods: [
      'GET'
    ],
    AllowedOrigins: [
      '*'
    ],
    AllowedHeaders: [
      '*'
    ],
    MaxAgeSeconds: 0
  }

  const corsRes = await S3.putBucketCors({
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [
        putPostDeleteHeadRule,
        getRule
      ]
    },
  }).promise()
  console.log(`Set policy and CORS for bucket '${bucketName}'.`)

  return {}
}

const unsetPolicyAndCors = async (bucketName) => {

  const policyRes = await S3.deleteBucketPolicy({
    Bucket: bucketName
  }).promise()

  const corsRes = await S3.deleteBucketCors({
    Bucket: bucketName
  }).promise()
  console.log(`Removed policy and CORS for bucket '${bucketName}'.`)

  return {}
}

const deploy = async (inputs, state, context) => {
  let outputs = state
  if (!state.bucketName && inputs.bucketName) {
    context.log(`Setting policy for bucket: ${inputs.bucketName}`)
    await setPolicyAndCors(inputs)
  } else if (!inputs.bucketName && state.bucketName) {
    context.log(`Removing policy for bucket: ${state.bucketName}`)
    await unsetPolicyAndCors(state.bucketName)
  } else if (state.bucketName !== inputs.bucketName) {
    context.log(`Removing policy for bucket: ${state.bucketName}`)
    await unsetPolicyAndCors(state.bucketName)
    context.log(`Setting policy for bucket: ${inputs.bucketName}`)
    await setPolicyAndCors(inputs)
  }
  return outputs
}

const remove = async (inputs, state, context) => {
  // context.log(`Removing policy for bucket: ${state.bucketName}`)
  // const outputs = await unsetPolicyAndCors(state.bucketName)
  // return outputs
}

module.exports = {
  deploy,
  remove
}
