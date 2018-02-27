const AWS = require('aws-sdk')
const { equals } = require('ramda')
const { getSwaggerDefinition, generateUrls } = require('./utils')

const APIGateway = new AWS.APIGateway({ region: 'us-east-1' }) // TODO: make configurable

const deleteApi = async (params) => {
  const { id } = params

  await APIGateway.deleteRestApi({
    restApiId: id
  }).promise()
  const outputs = {
    id: null,
    url: null
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
    urls
  }
  return outputs
}

const deploy = async (inputs, options, state, context) => {
  const noChanges =
    inputs.name === state.name &&
    inputs.roleArn === state.roleArn &&
    equals(inputs.routes, state.routes)

  let outputs
  if (noChanges) {
    outputs = state
  } else if (inputs.name && !state.name) {
    context.log(`Creating API Gateway: "${inputs.name}"`)
    outputs = await createApi(inputs)
  } else {
    context.log(`Updating API Gateway: "${inputs.name}"`)
    outputs = await updateApi({
      ...inputs,
      id: state.id
    })
  }
  return outputs
}

const remove = async (inputs, options, state, context) => {
  context.log(`Removing API Gateway: "${state.name}"`)
  const outputs = await deleteApi({ name: state.name, id: state.id })
  return outputs
}

module.exports = {
  deploy,
  remove
}
