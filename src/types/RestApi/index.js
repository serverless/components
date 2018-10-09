const { mapIndexed } = require('@serverless/utils')
const joinPath = require('path').join
const { isEmpty, keys, union, not, map, forEachObjIndexed, pick } = require('ramda')
const { joinUrl } = require('./utils')

const catchallParameterPattern = /{\.{3}([^}]+?)}/g
const pathParameterPattern = /{([^}]+?)}/g

const inputsProps = ['name', 'routes']

// "private" functions
async function deployIamRole(inputs, context) {
  const name = `${inputs.name}-iam-role-${context.instanceId}`
  const service = 'apigateway.amazonaws.com'

  const iamComponent = await context.load('aws-iam-role', 'iam', {
    name,
    service
  })
  const outputs = await iamComponent.deploy()
  outputs.name = name
  outputs.service = service
  return outputs
}

function getAwsApiGatewayInputs(inputs) {
  const apiGatewayInputs = {
    name: inputs.name,
    roleArn: inputs.roleArn,
    routes: {}
  }

  forEachObjIndexed((methods, path) => {
    const reparameterizedPath = path.replace(catchallParameterPattern, '{$1+}')
    const normalizedPath = reparameterizedPath.replace(/^\/+/, '')
    const routeObject = {}
    apiGatewayInputs.routes[normalizedPath] = routeObject

    forEachObjIndexed((methodObject, method) => {
      const normalizedMethod = method.toUpperCase()

      routeObject[normalizedMethod] = {
        lambdaArn: methodObject.function.arn,
        ...methodObject
      }
      delete routeObject[normalizedMethod].function
    }, methods)
  }, inputs.routes)

  return apiGatewayInputs
}

async function deployApiGateway(inputs, context) {
  const apiInputs = getAwsApiGatewayInputs(inputs)

  const apiGatewayComponent = await context.load('aws-apigateway', 'apig', apiInputs)
  const outputs = await apiGatewayComponent.deploy()
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
        lambdaArn: methodObject.function.arn
      })
    }, methods)
  }, inputs.routes)
  return eventGatewayInputs
}

async function deployEventGateway(inputs, context) {
  const eventGatewayInputs = getEventGatewayInputs(inputs)
  const deployPromises = mapIndexed(
    (input, index) => context.load('eventgateway', `eg-${index}`, input).then((eg) => eg.deploy()),
    eventGatewayInputs
  )
  return Promise.all(deployPromises)
}

async function removeIamRole(inputs, context) {
  // TODO: remove duplicate code
  const name = `${inputs.name}-iam-role`
  const service = 'apigateway.amazonaws.com'

  const iamComponent = await context.load('aws-iam-role', 'iam', {
    name,
    service
  })
  return iamComponent.remove()
}

async function removeApiGateway(inputs, context, state) {
  const apiInputs = getAwsApiGatewayInputs({
    ...inputs,
    roleArn: state.roleArn,
    routes: {}
  })
  const apiGatewayComponent = await context.load('aws-apigateway', 'apig', apiInputs)
  return apiGatewayComponent.remove()
}

async function removeEventGateway(inputs, context) {
  const eventGatewayInputs = getEventGatewayInputs(inputs)
  const removePromises = mapIndexed(
    (input, index) => context.load('eventgateway', `eg-${index}`, input).then((eg) => eg.remove()),
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
        if (
          !['any', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put'].includes(
            key.toLowerCase()
          )
        ) {
          throw new Error(
            `Configuration key "${key}" was interpreted as an HTTP method because it does not start with a slash, but it is not a valid method.`
          )
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

export default {
  async deploy(prevInstance, context) {
    const inputs = pick(inputsProps, this)
    const flatRoutes = flattenRoutes(inputs.routes)
    const flatInputs = { ...inputs, routes: flatRoutes }

    const outputs = {}
    if (inputs.gateway === 'eventgateway') {
      outputs.eventgateway = await deployEventGateway(flatInputs, context)
      outputs.url = outputs.eventgateway.url
      context.saveState(this, { url: outputs.url })
    } else if (inputs.gateway === 'aws-apigateway') {
      outputs.iam = await deployIamRole(inputs, context)
      outputs.apigateway = await deployApiGateway(
        {
          ...flatInputs,
          roleArn: outputs.iam.arn // TODO: add functionality to read from state so that update works
        },
        context
      )
      outputs.url = outputs.apigateway.url
      context.saveState(this, {
        roleArn: outputs.iam.arn,
        apigArn: outputs.apigateway.arn,
        url: outputs.url
      })
    }
    return Object.assign(this, outputs)
  },

  async remove(prevInstance, context) {
    const inputs = pick(inputsProps, this)
    if (inputs.gateway === 'eventgateway') {
      await removeEventGateway(inputs, context)
    } else if (inputs.gateway === 'aws-apigateway') {
      await removeIamRole(inputs, context)
      await removeApiGateway(inputs, context)
    }
    context.saveState(this, {})
    return Object.assign(this, {})
  },

  async info(prevInstance, context) {
    const state = context.getState(this)
    const inputs = pick(inputsProps, this)
    let message
    if (not(isEmpty(state))) {
      const baseUrl = state.url

      const flattenedRoutes = flattenRoutes(inputs.routes)
      let urlObjects = []
      forEachObjIndexed((route, path) => {
        const urlObject = {
          path,
          method: keys(route)
            .pop()
            .toUpperCase()
        }
        urlObjects = union(urlObjects, [urlObject])
      }, flattenedRoutes)

      const printableUrls = map((urlObject) => {
        const joinedUrl = joinUrl(baseUrl, [urlObject.path])
        return `  ${urlObject.method} - ${joinedUrl}`
      }, urlObjects)

      message = ['REST API resources:', ...printableUrls].join('\n')
    } else {
      message = 'No REST API state information available. Have you deployed it?'
    }
    context.log(message)
  }
}
