const AWS = require('aws-sdk')
const BbPromise = require('bluebird')

const IAM = new AWS.IAM({ region: 'us-east-1' })

const createPolicy = async ({name, bucketName}) => {
  const s3BucketPolicyDocument = {
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

  const policyRes = await IAM.createPolicy({
    PolicyName: name,
    Path: '/',
    PolicyDocument: JSON.stringify(s3BucketPolicyDocument)
  }).promise()
  console.log(`Policy '${name}' created with arn: '${policyRes.Policy.Arn}'`)

  await BbPromise.delay(15000)

  return {
    policyArn: policyRes.Policy.Arn
  }
}

const deletePolicy = async (name, policyArn) => {

  await IAM.deletePolicy({
    PolicyArn: policyArn
  }).promise()
  console.log(`Policy '${name}' deleted.`)

  return {
    policyArn: null
  }
}

const deploy = async (inputs, state, context) => {
  let outputs = state
  if (!state.name && inputs.name) {
    context.log(`Creating Policy: ${inputs.name}`)
    outputs = await createPolicy(inputs)
  } else if (!inputs.name && state.name) {
    context.log(`Removing Policy: ${state.name}`)
    outputs = await deletePolicy(state.name, state.policyArn)
  } else if (state.name !== inputs.name) {
    context.log(`Removing Policy: ${state.name}`)
    await deletePolicy(state.name, state.policyArn)
    context.log(`Creating Policy: ${inputs.name}`)
    outputs = await createPolicy(inputs)
  }
  return outputs
}

const remove = async (inputs, state, context) => {
  context.log(`Removing Policy: ${state.name}`)
  const outputs = await deletePolicy(state.name, state.policyArn)
  return outputs
}

module.exports = {
  deploy,
  remove
}
