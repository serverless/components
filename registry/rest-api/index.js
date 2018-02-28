const { addIndex, map, forEachObjIndexed } = require('ramda')

// "private" functions
async function deployIamRole(inputs, state, context) {
  const roleName = `${inputs.name}-iam-role`
  const iamInputs = {
    name: roleName,
    service: 'apigateway.amazonaws.com'
  }

  const iamComponent = await context.load('iam', 'iam')
  const outputs = await iamComponent.deploy(iamInputs)
  outputs.name = roleName
  return outputs
}

async function deployApiGateway(inputs, state, context) {
  const apiInputs = {
    name: inputs.name,
    roleArn: inputs.roleArn,
    routes: inputs.routes
  }

  const apiGatewayComponent = await context.load('apigateway', 'apig')
  const outputs = await apiGatewayComponent.deploy(apiInputs)
  outputs.name = inputs.name
  return outputs
}

function getEventGatewayInputs(inputs) {
  const eventGatewayInputs = []
  // TODO: update code to be functional
  forEachObjIndexed((methods, path) => {
    const normalizedPath = `${path.replace(/^\/+/, '')}`

    forEachObjIndexed((methodObject, method) => {
      const normalizedMethod = method.toUpperCase()

      eventGatewayInputs.push({
        event: 'http',
        path: normalizedPath,
        method: normalizedMethod,
        cors: methodObject.cors || false,
        space: inputs.space,
        eventGatewayApiKey: inputs.eventGatewayApiKey || null,
        lambdaArn: methodObject.lambdaArn
      })
    }, methods)
  }, inputs.routes)
  return eventGatewayInputs
}

async function deployEventGateway(inputs, state, context) {
  const eventGatewayInputs = getEventGatewayInputs(inputs)

  const mapIndexed = addIndex(map)
  const deployPromises = mapIndexed(
    (input, index) => context.load('eventgateway', `eg-${index}`).then((eg) => eg.deploy(input)),
    eventGatewayInputs
  )
  return Promise.all(deployPromises)
}

async function removeIamRole(inputs, state, context) {
  const iamComponent = await context.load('iam', 'iam')
  return iamComponent.remove(inputs)
}

async function removeApiGateway(inputs, state, context) {
  const apiGatewayComponent = await context.load('apigateway', 'apig')
  return apiGatewayComponent.remove(inputs)
}

async function removeEventGateway(inputs, state, context) {
  const eventGatewayInputs = getEventGatewayInputs(inputs)

  const mapIndexed = addIndex(map)
  const removePromises = mapIndexed(
    (input, index) => context.load('eventgateway', `eg-${index}`).then((eg) => eg.remove(input)),
    eventGatewayInputs
  )
  return Promise.all(removePromises)
}

// "public" functions
async function deploy(inputs, options, state, context) {
  const outputs = {}
  if (inputs.gateway === 'eventgateway') {
    outputs.eventgateway = await deployEventGateway(inputs, state, context)
  } else if (inputs.gateway === 'apigateway') {
    outputs.iam = await deployIamRole(inputs, state, context)
    outputs.apigateway = await deployApiGateway(
      {
        ...inputs,
        roleArn: outputs.iam.arn // TODO: add functionality to read from state so that update works
      },
      state,
      context
    )
  }
  return outputs
}

async function remove(inputs, options, state, context) {
  if (inputs.gateway === 'eventgateway') {
    await removeEventGateway(inputs, state, context)
  } else if (inputs.gateway === 'apigateway') {
    await removeIamRole(inputs, state, context)
    await removeApiGateway(inputs, state, context)
  }
  return {}
}

module.exports = {
  deploy,
  remove
}
