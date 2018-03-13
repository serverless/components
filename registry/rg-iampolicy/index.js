/* eslint-disable no-console */

const AWS = require('aws-sdk')
const BbPromise = require('bluebird')

const IAM = new AWS.IAM({ region: 'us-east-1' })

const createPolicy = async ({ name, bucketName }) => {
  const s3BucketPolicyDocument = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: {
        AWS: '*'
      },
      Action: [ 's3:GetObject' ],
      Resource: [ `arn:aws:s3:::${bucketName}/*` ]
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

const deploy = async (inputs, context) => {
  let outputs = context.state
  if (!context.state.name && inputs.name) {
    context.log(`Creating Policy: ${inputs.name}`)
    outputs = await createPolicy(inputs)
  } else if (!inputs.name && context.state.name) {
    context.log(`Removing Policy: ${context.state.name}`)
    outputs = await deletePolicy(context.state.name, context.state.policyArn)
  } else if (context.state.name !== inputs.name) {
    context.log(`Removing Policy: ${context.state.name}`)
    await deletePolicy(context.state.name, context.state.policyArn)
    context.log(`Creating Policy: ${inputs.name}`)
    outputs = await createPolicy(inputs)
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.name) return {}

  context.log(`Removing Policy: ${context.state.name}`)
  await deletePolicy(context.state.name, context.state.policyArn)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
