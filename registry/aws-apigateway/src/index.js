const AWS = require('aws-sdk')
const { forEachObjIndexed, equals } = require('ramda')
const { getSwaggerDefinition, generateUrl, generateUrls } = require('./utils')

const APIGateway = new AWS.APIGateway({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

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

const updateStageVariables = async (params) => {

  const {
    id, name, stageName, StageVariables
  } = params

  if (id == undefined) {
    const currentApis = await APIGateway.getRestApis().promise()
    id = currentApis.items.filter(e => e.name == name)[0].id
  }

  let currentStage
  try {
    currentStage = await APIGateway.getStage({
      restApiId: id,
      stageName: stageName
    }).promise()
  } catch (e) {
    if (e.message == 'Invalid stage identifier specified') {
      await APIGateway.createDeployment({ restApiId: id, stageName: stageName }).promise()
      currentStage = await APIGateway.getStage({
        restApiId: id,
        stageName: stageName
      }).promise()
    }
  } finally {
    let updatedKeys = Object.keys(StageVariables)
    let patchOperations = []

    if (currentStage.variables) {
      const currentKeys = Object.keys(currentStage.variables)
      forEachObjIndexed((value, key) => {
        if (!updatedKeys.includes(key)) {
          patchOperations.push({
            op: 'remove',
            path: '/variables/' + key,
            value: value
          })
        }
      }, currentStage.variables)
    }

    forEachObjIndexed((value, key) => {
      patchOperations.push({
        op: 'replace',
        path: '/variables/' + key,
        value: value
      })
    }, StageVariables)

    await APIGateway.updateStage({
      restApiId: id,
      stageName: stageName,
      patchOperations: patchOperations
    }).promise()
  }
}

const createApi = async (params) => {
  let {
    name, roleArn, routes, stageName, securityDefinitions, definitions
  } = params

  const swagger = getSwaggerDefinition(name, roleArn, routes, securityDefinitions, definitions)
  const json = JSON.stringify(swagger)

  const res = await APIGateway.importRestApi({
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({
    restApiId: res.id,
    stageName: stageName 
  }).promise()

  updateStageVariables(params)
  const url = generateUrl(res.id)
  const urls = generateUrls(routes, res.id)

  const outputs = {
    id: res.id,
    url,
    urls
  }
  return outputs
}

const updateApi = async (params) => {

  const {
    name, roleArn, routes, id, stageName, securityDefinitions, definitions
  } = params

  if (id == undefined) {
    const currentApis = await APIGateway.getRestApis().promise()
    id = currentApis.items.filter(e => e.name == name)[0].id
  }

  updateStageVariables(params)

  const swagger = getSwaggerDefinition(name, roleArn, routes, securityDefinitions, definitions, params)
  const json = JSON.stringify(swagger)

  await APIGateway.putRestApi({
    restApiId: id,
    mode: 'overwrite',
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({
    restApiId: id,
    stageName: stageName 
  }).promise()

  const url = generateUrl(id)
  const urls = generateUrls(routes, id)

  const outputs = {
    id,
    url,
    urls
  }
  return outputs
}

const deploy = async (inputs, context) => {
  const noChanges =
    inputs.stageName === context.state.stageName &&
    inputs.name === context.state.name &&
    inputs.roleArn === context.state.roleArn &&
    equals(inputs.routes, context.state.routes)

  let outputs
  if (noChanges) {
    outputs = context.state
  } else if (inputs.name && !context.state.name) {
    context.log(`Creating API Gateway: "${inputs.name}"`)
    outputs = createApi(inputs)
  } else {
    context.log(`Updating API Gateway: "${inputs.name}"`)
    outputs = updateApi({
      ...inputs,
      id: context.state.id,
      url: context.state.url
    })
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  const outputs = {
    id: null,
    url: null,
    urls: null
  }

  try {
    context.log(`Removing API Gateway: "${context.state.name}"`)
    await deleteApi({ name: context.state.name, id: context.state.id })
  } catch (e) {
    if (!e.message.includes('Invalid REST API identifier specified')) {
      throw e
    }
  }

  context.saveState()
  return outputs
}

module.exports = {
  deploy,
  remove
}
