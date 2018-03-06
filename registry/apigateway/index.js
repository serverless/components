const AWS = require('aws-sdk')
const { equals, keys } = require('ramda')
const { getSwaggerDefinition, generateUrls } = require('./utils')

const APIGateway = new AWS.APIGateway({ region: 'us-east-1' }) // TODO: make configurable

const deleteApi = async (params) => {
  const { id } = params

  await APIGateway.deleteRestApi({
    restApiId: id
  }).promise()
  const outputs = {
    id: null,
    url: null,
    urls: null
  }
  return outputs
}

const createApi = async (params) => {
  const { name, roleArn, routes } = params

  const swagger = getSwaggerDefinition(name, roleArn, routes)
  const json = JSON.stringify(swagger)

  const res = await APIGateway.importRestApi({
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: res.id, stageName: 'dev' }).promise()

  const urls = generateUrls(routes, res.id)

  const outputs = {
    id: res.id,
    url: `https://${res.id}.execute-api.us-east-1.amazonaws.com/dev/${keys(routes)[0].replace(/^\/+/, '')}`,
    urls
  }
  return outputs
}

const updateApi = async (params) => {
  const {
    name, roleArn, routes, id
  } = params

  const swagger = getSwaggerDefinition(name, roleArn, routes)
  const json = JSON.stringify(swagger)

  await APIGateway.putRestApi({
    restApiId: id,
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: id, stageName: 'dev' }).promise()

  const urls = generateUrls(routes, id)

  const outputs = {
    id,
    url: `https://${id}.execute-api.us-east-1.amazonaws.com/dev/${keys(routes)[0].replace(/^\/+/, '')}`,
    urls
  }
  return outputs
}

const deploy = async (inputs, context) => {
  const noChanges =
    inputs.name === context.state.name &&
    inputs.roleArn === context.state.roleArn &&
    equals(inputs.routes, context.state.routes)

  let outputs
  if (noChanges) {
    outputs = context.state
  } else if (inputs.name && !context.state.name) {
    context.log(`Creating API Gateway: "${inputs.name}"`)
    outputs = await createApi(inputs)
  } else {
    context.log(`Updating API Gateway: "${inputs.name}"`)
    outputs = await updateApi({
      ...inputs,
      id: context.state.id
    })
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing API Gateway: "${context.state.name}"`)
  const outputs = await deleteApi({ name: context.state.name, id: context.state.id })
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

module.exports = {
  deploy,
  remove
}
