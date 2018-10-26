import { join as joinPath } from 'path'
import { isEmpty, keys, union, not, map, forEach } from '@serverless/utils'
import { joinUrl } from './utils'

const catchallParameterPattern = /{\.{3}([^}]+?)}/g

async function getAwsApiGatewayInputs(inputs) {
  const apiGatewayInputs = {
    name: inputs.apiName,
    role: inputs.role,
    routes: {}
  }

  for (const [path, methods] of Object.entries(inputs.routes)) {
    const reparameterizedPath = path.replace(catchallParameterPattern, '{$1+}')
    const normalizedPath = reparameterizedPath.replace(/^\/+/, '')
    const routeObject = {}
    apiGatewayInputs.routes[normalizedPath] = routeObject

    for (const [method, methodObject] of Object.entries(methods)) {
      const normalizedMethod = method.toUpperCase()
      routeObject[normalizedMethod] = methodObject
    }
  }

  return apiGatewayInputs
}

async function constructApiGateway(inputs, context, provider) {
  const apiInputs = await getAwsApiGatewayInputs(inputs)

  const apiGatewayComponent = await context.loadType('AwsApiGateway')
  const apiGateway = await context.construct(apiGatewayComponent, {
    ...apiInputs,
    provider: provider
  })
  return apiGateway
}

function flattenRoutes(routes) {
  const flattened = {}
  function doFlatten(subRoutes, basePath) {
    forEach((value, key) => {
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

const RestApi = async function(SuperClass, SuperContext) {
  const iamComponent = await SuperContext.loadType('AwsIamRole')

  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.inputs = inputs
      this.apiName = inputs.apiName

      if (!['AwsApiGateway'].includes(inputs.gateway)) {
        throw new Error('Specified "gateway" is not supported.')
      }

      const flatRoutes = flattenRoutes(inputs.routes)

      const childComponents = []

      const name = `${inputs.apiName}-iam-role`
      const service = 'apigateway.amazonaws.com'
      this.role = await context.construct(iamComponent, {
        roleName: name,
        service,
        provider: inputs.provider
      })
      childComponents.push(this.role)

      const flatInputs = { ...inputs, routes: flatRoutes }
      this.gateway = await constructApiGateway(
        {
          ...flatInputs,
          role: this.role // TODO: add functionality to read from state so that update works
        },
        context,
        inputs.provider
      )
      childComponents.push(this.gateway)

      this.childComponents = childComponents
    }

    async define() {
      return this.childComponents || []
    }

    async info(prevInstance, context) {
      const state = context.getState(this)
      const inputs = this.inputs
      let message
      if (not(isEmpty(state))) {
        const baseUrl = state.url

        const flattenedRoutes = flattenRoutes(inputs.routes)
        let urlObjects = []
        forEach((route, path) => {
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
}

export default RestApi
