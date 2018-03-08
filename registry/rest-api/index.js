const { addIndex, map, forEachObjIndexed } = require('ramda')
const joinPath = require('path').join

const catchallParameterPattern = /{\.{3}([^}]+?)}/g
const pathParameterPattern = /{([^}]+?)}/g

// "private" functions
async function deployIamRole(inputs, context) {
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

function getAwsApiGatewayInputs(inputs) {
  const apiGatewayInputs = {
    name: inputs.name,
    roleArn: inputs.roleArn,
    routes: {}
  }

  forEachObjIndexed((methods, path) => {
    const reparameterizedPath = path
      .replace(catchallParameterPattern, '{$1+}')
    const normalizedPath = reparameterizedPath.replace(/^\/+/, '')
    const routeObject = {}
    apiGatewayInputs.routes[normalizedPath] = routeObject

    forEachObjIndexed((methodObject, method) => {
      const normalizedMethod = method.toUpperCase()

      routeObject[normalizedMethod] = methodObject
    }, methods)
  }, inputs.routes)

  return apiGatewayInputs
}

async function deployApiGateway(inputs, context) {
  const apiInputs = getAwsApiGatewayInputs(inputs)

  const apiGatewayComponent = await context.load('apigateway', 'apig')
  const outputs = await apiGatewayComponent.deploy(apiInputs)
  outputs.name = inputs.name
  return outputs
}

function getEventGatewayInputs(inputs) {
  const eventGatewayInputs = []
  // TODO: update code to be functional
  forEachObjIndexed((methods, path) => {
    const reparameterizedPath = path
      .replace(catchallParameterPattern, '*$1')
      .replace(pathParameterPattern, ':$1')
    const normalizedPath = reparameterizedPath.replace(/^\/+/, '')

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

async function deployEventGateway(inputs, context) {
  const eventGatewayInputs = getEventGatewayInputs(inputs)

  const mapIndexed = addIndex(map)
  const deployPromises = mapIndexed(
    (input, index) => context.load('eventgateway', `eg-${index}`).then((eg) => eg.deploy(input)),
    eventGatewayInputs
  )
  return Promise.all(deployPromises)
}

async function removeIamRole(inputs, context) {
  const iamComponent = await context.load('iam', 'iam')
  return iamComponent.remove(inputs)
}

async function removeApiGateway(inputs, context) {
  const apiGatewayComponent = await context.load('apigateway', 'apig')
  return apiGatewayComponent.remove(inputs)
}

async function removeEventGateway(inputs, context) {
  const eventGatewayInputs = getEventGatewayInputs(inputs)

  const mapIndexed = addIndex(map)
  const removePromises = mapIndexed(
    (input, index) => context.load('eventgateway', `eg-${index}`).then((eg) => eg.remove(input)),
    eventGatewayInputs
  )
  return Promise.all(removePromises)
}

function flattenRoutes(routes) {
  const flattened = {}
  function doFlatten(subRoutes, basePath) {
    forEachObjIndexed((value, key) => {
      if (key.startsWith('/')) {
        doFlatten(value, joinPath(basePath, key))
      } else {
        if (![ 'any', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put' ].includes(key.toLowerCase())) {
          throw new Error(`Configuration key "${key}" was interpreted as an HTTP method because it does not start with a slash, but it is not a valid method.`)
        }
        if (flattened[basePath]) {
          if (flattened[basePath][key]) {
            throw new Error(`Method "${key}" on route [${basePath}] was mapped more than once.`)
          }
        } else {
          flattened[basePath] = {}
        }
        flattened[basePath][key] = value
      }
    }, subRoutes)
  }
  doFlatten(routes, '/')

  return flattened
}

// "public" functions
async function deploy(inputs, context) {
  const flatRoutes = flattenRoutes(inputs.routes)
  const flatInputs = { ...inputs, routes: flatRoutes }

  const outputs = {}
  if (inputs.gateway === 'eventgateway') {
    outputs.eventgateway = await deployEventGateway(flatInputs, context)
  } else if (inputs.gateway === 'apigateway') {
    outputs.iam = await deployIamRole(inputs, context)
    outputs.apigateway = await deployApiGateway(
      {
        ...flatInputs,
        roleArn: outputs.iam.arn // TODO: add functionality to read from state so that update works
      },
      context
    )
  }
  return outputs
}

async function remove(inputs, context) {
  if (inputs.gateway === 'eventgateway') {
    await removeEventGateway(inputs, context)
  } else if (inputs.gateway === 'apigateway') {
    await removeIamRole(inputs, context)
    await removeApiGateway(inputs, context)
  }
  return {}
}

module.exports = {
  deploy,
  remove
}
