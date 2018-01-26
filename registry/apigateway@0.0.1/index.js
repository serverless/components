const ServerlessComponentsEslam = require('serverless-components-eslam')
const getSwaggerDefinition = require('./utils/getSwaggerDefinition')
const createRole = require('./utils/createRole')
const removeRole = require('./utils/removeRole')

const { AWS, BbPromise } = ServerlessComponentsEslam

const APIGateway = new AWS.APIGateway({region: 'us-east-1'})

const remove = async (name, id) => {
  await removeRole(name)
  await APIGateway.deleteRestApi({
    restApiId: id
  }).promise()
  const outputs = {
    id: null,
    roleArn: null,
    url: null
  }
  return outputs
}

const create = async ({ name, lambda, path, method }) => {
  const apiRoleArn = await createRole(name)
  await BbPromise.delay(10000)

  const swagger = getSwaggerDefinition(name, lambda, path, method, apiRoleArn)
  const json = JSON.stringify(swagger)

  const res = await APIGateway.importRestApi({
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: res.id, stageName: 'dev' }).promise()

  const outputs = {
    id: res.id,
    roleArn: apiRoleArn,
    url: `https://${res.id}.execute-api.us-east-1.amazonaws.com/dev/${path.replace(/^\/+/, '')}`
  }
  return outputs
}

const update = async ({ name, lambda, path, method }, id, apiRoleArn) => {
  const swagger = getSwaggerDefinition(name, lambda, path, method, apiRoleArn)
  const json = JSON.stringify(swagger)

  await APIGateway.putRestApi({
    restApiId: id,
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: id, stageName: 'dev' }).promise()

  const outputs = {
    id,
    roleArn: apiRoleArn,
    url: `https://${id}.execute-api.us-east-1.amazonaws.com/dev/${path.replace(/^\/+/, '')}`
  }
  return outputs
}

module.exports = async (inputs, state) => {
  let outputs
  if (inputs.name && !state.name) {
    console.log(`Creating APIG: ${inputs.name}`)
    outputs = await create(inputs)
  } else if (state.name && !inputs.name) {
    console.log(`Removing APIG: ${state.name}`)
    outputs = await remove(state.name, state.id)
  } else if (inputs.name !== state.name) {
    console.log(`Removing APIG: ${state.name}`)
    await remove(state.name, state.apiId)
    console.log(`Creating APIG: ${inputs.name}`)
    outputs = await create(inputs)
  } else {
    console.log(`Updating APIG: ${inputs.name}`)
    outputs = await update(inputs, state.id, state.roleArn)
  }
  console.log('')
  return outputs
}
