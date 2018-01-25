const ServerlessComponentsEslam = require('serverless-components-eslam')
const getSwaggerDefinition = require('./utils/getSwaggerDefinition')
const createRole = require('./utils/createRole')
const removeRole = require('./utils/removeRole')

const { AWS, BbPromise } = ServerlessComponentsEslam

const APIGateway = new AWS.APIGateway({region: 'us-east-1'})

const remove = async (apiName, apiId) => {
  await removeRole(apiName)
  await APIGateway.deleteRestApi({
    restApiId: apiId
  }).promise()
  const outputs = {
    apiId: null,
    apiRoleArn: null,
    endpoint: null
  }
  return outputs
}

const create = async ({ name, lambdaArn, path, method }) => {
  const apiRoleArn = await createRole(name)
  await BbPromise.delay(10000)

  const swagger = getSwaggerDefinition(name, lambdaArn, path, method, apiRoleArn)
  const json = JSON.stringify(swagger)

  const res = await APIGateway.importRestApi({
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: res.id, stageName: 'dev' }).promise()

  const outputs = {
    apiId: res.id,
    apiRoleArn,
    endpoint: `https://${res.id}.execute-api.us-east-1.amazonaws.com/dev/${path.replace(/^\/+/, '')}`
  }
  return outputs
}

const update = async ({ name, lambdaArn, path, method }, apiId, apiRoleArn) => {
  const swagger = getSwaggerDefinition(name, lambdaArn, path, method, apiRoleArn)
  const json = JSON.stringify(swagger)

  await APIGateway.putRestApi({
    restApiId: apiId,
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: apiId, stageName: 'dev' }).promise()

  const outputs = {
    apiId,
    apiRoleArn,
    endpoint: `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev/${path.replace(/^\/+/, '')}`
  }
  return outputs
}

module.exports = async (config, state) => {
  let outputs
  if (!config.name && !state.name) {
    console.log('Skipping APIG: no APIG name provided')
  } else if (config.name && !state.name) {
    console.log(`Creating APIG: ${config.name}`)
    outputs = await create(config)
  } else if (state.name && !config.name) {
    console.log(`Removing APIG: ${state.name}`)
    outputs = await remove(state.name, state.apiId)
  } else if (config.name !== state.name) {
    console.log(`Removing APIG: ${state.name}`)
    await remove(state.name, state.apiId)
    console.log(`Creating APIG: ${config.name}`)
    outputs = await create(config)
  } else {
    console.log(`Updating APIG: ${config.name}`)
    outputs = await update(config, state.apiId, state.apiRoleArn)
  }
  console.log('Done')
  return outputs
}
