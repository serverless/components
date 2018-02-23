const AWS = require('aws-sdk')
const APIGateway = new AWS.APIGateway({region: 'us-east-1'})

const deleteApi = async (name, id) => {
  await APIGateway.deleteRestApi({
    restApiId: id
  }).promise()
  const outputs = {
    id: null,
    url: null
  }
  return outputs
}

const createApi = async ({ name, lambda, path, method, role }, getSwaggerDefinition) => {
  const swagger = getSwaggerDefinition(name, lambda, path, method, role)
  const json = JSON.stringify(swagger)

  const res = await APIGateway.importRestApi({
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: res.id, stageName: 'dev' }).promise()

  const outputs = {
    id: res.id,
    url: `https://${res.id}.execute-api.us-east-1.amazonaws.com/dev/${path.replace(/^\/+/, '')}`
  }
  return outputs
}

const updateApi = async ({ name, lambda, path, method, role }, id, getSwaggerDefinition) => {
  const swagger = getSwaggerDefinition(name, lambda, path, method, role)
  const json = JSON.stringify(swagger)

  await APIGateway.putRestApi({
    restApiId: id,
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: id, stageName: 'dev' }).promise()

  const outputs = {
    id,
    url: `https://${id}.execute-api.us-east-1.amazonaws.com/dev/${path.replace(/^\/+/, '')}`
  }
  return outputs
}

const deploy = async (inputs, state, context) => {
  const noChanges = (inputs.name === state.name && inputs.method === state.method &&
    inputs.path === state.path && inputs.lambda === state.lambda && inputs.role === state.role)
  let outputs
  if (noChanges) {
    outputs = state
  } else if (inputs.name && !state.name) {
    context.cli.log(`Creating APIG: ${inputs.name}`)
    outputs = await createApi(inputs, context.getSwaggerDefinition)
  } else if (state.name && !inputs.name) {
    context.cli.log(`Removing APIG: ${state.name}`)
    outputs = await deleteApi(state.name, state.id)
  } else if (inputs.name !== state.name) {
    context.cli.log(`Removing APIG: ${state.name}`)
    await deleteApi(state.name, state.id)
    context.cli.log(`Creating APIG: ${inputs.name}`)
    outputs = await createApi(inputs, context.getSwaggerDefinition)
  } else {
    context.cli.log(`Updating APIG: ${inputs.name}`)
    outputs = await updateApi(inputs, state.id, context.getSwaggerDefinition)
  }
  return outputs
}

const remove = async (inputs, state, context) => {
  context.cli.log(`Removing APIG: ${state.name}`)
  const outputs = await deleteApi(state.name, state.id)
  return outputs
}

module.exports = {
  deploy,
  remove
}
