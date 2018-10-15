const { mapIndexed } = require('@serverless/utils')
const joinPath = require('path').join
const { isEmpty, keys, union, not, map, forEachObjIndexed } = require('ramda')
const { resolve } = require('../../utils/variable')
const { joinUrl } = require('./utils')

const catchallParameterPattern = /{\.{3}([^}]+?)}/g
const pathParameterPattern = /{([^}]+?)}/g

async function getAwsApiGatewayInputs(inputs, context, funcs, authorizerFunc) {
  const apiGatewayInputs = {
    name: inputs.name,
    roleArn: inputs.roleArn,
    routes: {}
  }

  if (authorizerFunc) {
    const { function: _, ...authorizerParams } = inputs.authorizer
    apiGatewayInputs.authorizer = {
      authorizerUri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${
        authorizerFunc.children.fn.arn
      }/invocations`,
      ...authorizerParams
    }
  }

  for (const [path, methods] of Object.entries(inputs.routes)) {
    const reparameterizedPath = path.replace(catchallParameterPattern, '{$1+}')
    const normalizedPath = reparameterizedPath.replace(/^\/+/, '')
    const routeObject = {}
    apiGatewayInputs.routes[normalizedPath] = routeObject

    for (const [method, methodObject] of Object.entries(methods)) {
      const normalizedMethod = method.toUpperCase()
      const { functionInstance } = funcs.find((obj) => obj.path === path && obj.method === method)
      routeObject[normalizedMethod] = methodObject

      if (functionInstance) {
        Object.assign(routeObject[normalizedMethod], {
          lambdaArn: functionInstance.children.fn.arn
        })
      }
      delete routeObject[normalizedMethod].function
    }
  }

  return apiGatewayInputs
}

async function deployApiGateway(inputs, context, provider, funcs, authorizerFunc) {
  const apiInputs = await getAwsApiGatewayInputs(inputs, context, funcs, authorizerFunc)

  const apiGatewayComponent = await context.loadType('AwsApiGateway')
  const apiGateway = await context.construct(apiGatewayComponent, {
    ...apiInputs,
    provider: provider
  })
  const outputs = await apiGateway.deploy(undefined, context)
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
  const apiInputs = await getAwsApiGatewayInputs(
    {
      ...inputs,
      roleArn: state.roleArn,
      routes: {}
    },
    context
  )
  const apiGatewayComponent = await context.loadType('AwsApiGateway')
  const apiGateway = context.construct(apiGatewayComponent, apiInputs)
  return apiGateway.remove()
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
        if (key.toLowerCase() === 'routes') {
          return doFlatten(value, basePath)
        } else if (
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

module.exports = {
  construct(inputs) {
    this.inputs = inputs
  },

  async define(context) {
    const inputs = this.inputs
    const flatRoutes = flattenRoutes(inputs.routes)
    const functions = []
    const tr = []
    for (const [route, routeProps] of Object.entries(flatRoutes)) {
      for (const [method, methodProps] of Object.entries(routeProps)) {
        if (methodProps.function) {
          const func = resolve(methodProps.function)
          functions.push({ path: route, method, functionInstance: func })
        }
      }
    }

    const name = `${inputs.name}-iam-role-${Math.random()
      .toString(36)
      .substring(7)}`
    const service = 'apigateway.amazonaws.com'

    const iamComponent = await context.loadType('AwsIamRole')
    this.role = await context.construct(iamComponent, {
      roleName: name,
      service,
      provider: inputs.provider
    })

    if (inputs.authorizer && inputs.authorizer.function) {
      const func = resolve(inputs.authorizer.function)
      tr.push(func)
      this.authorizerFunction = func
    }

    this.functions = functions
    tr.concat([...functions.map((f) => f.functionInstance), this.role])
    return tr
  },

  async deploy(prevInstance, context) {
    const inputs = this.inputs
    const flatRoutes = flattenRoutes(inputs.routes)
    const flatInputs = { ...inputs, routes: flatRoutes }

    const outputs = {}
    if (inputs.gateway === 'eventgateway') {
      outputs.eventgateway = await deployEventGateway(flatInputs, context)
      outputs.url = outputs.eventgateway.url
      context.saveState({ url: outputs.url })
    } else if (inputs.gateway === 'AwsApiGateway') {
      outputs.iam = this.role
      outputs.apigateway = await deployApiGateway(
        {
          ...flatInputs,
          roleArn: outputs.iam.arn // TODO: add functionality to read from state so that update works
        },
        context,
        inputs.provider,
        this.functions,
        this.authorizerFunction
      )
      outputs.url = outputs.apigateway.url
      context.saveState({
        roleArn: outputs.iam.arn,
        apigArn: outputs.apigateway.arn,
        url: outputs.url
      })
    }

    return Object.assign(this, outputs)
  },

  async remove(prevInstance, context) {
    const state = context.getState(this)
    const inputs = this.inputs
    const flatRoutes = flattenRoutes(inputs.routes)
    const routes = { ...state.routes, flatRoutes }

    forEachObjIndexed(async (fields) => {
      if (fields.gateway === 'eventgateway') {
        await removeEventGateway(fields, context)
      } else if (fields.gateway === 'aws-apigateway') {
        await removeIamRole(fields, context)
        await removeApiGateway(fields, context)
      }
    }, routes)
    context.saveState(this, {})
    return Object.assign(this, {})
  },

  async info(prevInstance, context) {
    const state = context.getState(this)
    const inputs = this.inputs
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
