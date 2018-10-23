const joinPath = require('path').join
const { forEachObjIndexed } = require('ramda')
const { resolve } = require('@serverless/utils')

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

export default function(SuperClass) {
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
      const iamComponent = await context.loadType('AwsIamRole')
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

    async info() {
      const inputs = this.inputs
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

          Object.assign(newPathObject, { [method]: newMethodObject })
        }
        Object.assign(flatRoutes, { [path]: newPathObject })
      }

      return { title: this.apiName, type: this.extends, data: { routes: flatRoutes } }
    }
  }
}
