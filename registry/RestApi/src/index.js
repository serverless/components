import { join as joinPath } from 'path'
import { forEach, resolve, reduce } from '@serverless/utils'

const catchallParameterPattern = /{\.{3}([^}]+?)}/g

async function getAwsApiGatewayInputs(inputs) {
  const apiGatewayInputs = {
    apiName: inputs.apiName,
    role: inputs.role,
    routes: {}
  }

  apiGatewayInputs.routes = reduce(
    (pathAcc, methods, path) => {
      const reparameterizedPath = path.replace(catchallParameterPattern, '{$1+}')
      const normalizedPath = reparameterizedPath.replace(/^\/+/, '')
      const methodDefinitions = reduce(
        (methodAcc, methodObject, method) => {
          const normalizedMethod = method.toUpperCase()
          methodAcc[normalizedMethod] = methodObject
          return methodAcc
        },
        {},
        methods
      )
      pathAcc[normalizedPath] = methodDefinitions
      return pathAcc
    },
    {},
    inputs.routes
  )

  return apiGatewayInputs
}

async function constructApiGateway(inputs, context, provider) {
  const apiInputs = await getAwsApiGatewayInputs(inputs)

  const apiGatewayComponent = await context.import('AwsApiGateway')
  const apiGateway = await context.construct(apiGatewayComponent, {
    ...apiInputs,
    provider: provider
  })
  return apiGateway
}

function flattenRoutes(routes) {
  const flattened = {}
  function doFlatten(subRoutes, basePath) {
    forEach((valueO, keyO) => {
      const key = resolve(keyO)
      const value = resolve(valueO)
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
  const iamComponent = await SuperContext.import('AwsIamRole')

  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.inputs = inputs
      this.apiName = inputs.apiName
    }

    async define(context) {
      const { inputs } = this
      if (!['AwsApiGateway'].includes(resolve(inputs.gateway))) {
        throw new Error('Specified "gateway" is not supported.')
      }

      const provider = resolve(inputs.provider)
      const flatRoutes = flattenRoutes(resolve(inputs.routes))
      const childComponents = []
      const name = `${resolve(inputs.apiName)}-iam-role`
      const service = 'apigateway.amazonaws.com'
      this.role = await context.construct(iamComponent, {
        roleName: name,
        service,
        provider
      })
      childComponents.push(this.role)

      const flatInputs = { ...inputs, routes: flatRoutes }
      this.gateway = await constructApiGateway(
        {
          ...flatInputs,
          role: this.role // TODO: add functionality to read from state so that update works
        },
        context,
        provider
      )
      childComponents.push(this.gateway)

      return childComponents
    }

    async deploy() {
      Object.assign(this, {
        apiName: resolve(this.inputs.apiName),
        paths: this.gateway.urls,
        baseUrl: this.gateway.baseUrl,
        gateway: {
          id: this.gateway.id
        }
      })
    }

    async info() {
      const { inputs } = this
      const flatRoutes = {}
      for (const [path, pathObject] of Object.entries(flattenRoutes(inputs.routes))) {
        const newPathObject = { ...pathObject }
        for (const [method, methodObject] of Object.entries(pathObject)) {
          const newMethodObject = { ...methodObject }
          if (methodObject.function) {
            const func = resolve(methodObject.function)
            newMethodObject.function = `$${resolve(func.functionName)}`
          }
          if (methodObject.authorizer) {
            const auth = resolve(methodObject.authorizer)
            const authFunc = resolve(auth.function)
            if (authFunc) {
              newMethodObject.authorizer = Object.assign(auth, {
                function: `$${resolve(authFunc.functionName)}`
              })
            }
          }
          newPathObject[method] = newMethodObject
        }
        flatRoutes[path] = newPathObject
      }

      return {
        title: this.apiName,
        type: this.name,
        data: { routes: flatRoutes, baseUrl: this.baseUrl }
      }
    }
  }
}

export default RestApi
