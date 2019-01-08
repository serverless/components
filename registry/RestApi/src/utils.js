import { join as joinPath } from 'path'
import { forEachObjIndexed, set, or, reduce, forEach, resolve } from '@serverless/utils'

// TODO: remove hardcoding of region (e.g. like us-east-1)

// "private" functions
function getNormalizedPath(path) {
  return `/${path.replace(/^\/+/, '')}`
}

function getNormalizedMethod(method) {
  return method.toLowerCase()
}

function getDefaultResponses(useCors) {
  const defaultResponses = {
    200: {
      description: 'Success'
    }
  }

  if (useCors) {
    let defaultResponsesWithCors = { ...defaultResponses }
    defaultResponsesWithCors = set(
      [200],
      {
        headers: {
          'Access-Control-Allow-Headers': {
            type: 'string'
          },
          'Access-Control-Allow-Methods': {
            type: 'string'
          },
          'Access-Control-Allow-Origin': {
            type: 'string'
          }
        }
      },
      defaultResponsesWithCors
    )
    return defaultResponsesWithCors
  }
  return defaultResponses
}

function getApiGatewayIntegration(roleArn, uri, useCors) {
  const apiGatewayIntegration = {
    'x-amazon-apigateway-integration': {
      type: 'aws_proxy',
      httpMethod: 'POST',
      credentials: roleArn,
      uri,
      responses: {
        default: {
          statusCode: '200'
        }
      }
    }
  }

  if (useCors) {
    let apiGatewayIntegrationWithCors = { ...apiGatewayIntegration }
    apiGatewayIntegrationWithCors = set(
      ['x-amazon-apigateway-integration', 'responses', 'default', 'responseParameters'],
      {
        'method.response.header.Access-Control-Allow-Headers':
          "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
        'method.response.header.Access-Control-Allow-Methods': "'*'",
        'method.response.header.Access-Control-Allow-Origin': "'*'"
      },
      apiGatewayIntegrationWithCors
    )
    return apiGatewayIntegrationWithCors
  }
  return apiGatewayIntegration
}

function getCorsOptionsConfig() {
  return {
    summary: 'CORS support',
    description: 'Enable CORS by returning correct headers',
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: ['CORS'],
    'x-amazon-apigateway-integration': {
      type: 'mock',
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }'
      },
      responses: {
        default: {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers':
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
            'method.response.header.Access-Control-Allow-Methods': "'*'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          },
          responseTemplates: {
            'application/json': '{}'
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Default response for CORS method',
        headers: {
          'Access-Control-Allow-Headers': {
            type: 'string'
          },
          'Access-Control-Allow-Methods': {
            type: 'string'
          },
          'Access-Control-Allow-Origin': {
            type: 'string'
          }
        }
      }
    }
  }
}

function getSecurityDefinition(authorizerObj, name, region = 'us-east-1' /* , path , method */) {
  if (authorizerObj) {
    const { function: func, ...authorizerParams } = authorizerObj
    return {
      name: name,
      definition: {
        type: 'apiKey', // Required and the value must be "apiKey" for an API Gateway API.
        name: 'Authorization', // The name of the header containing the authorization token.
        in: 'header', // Required and the value must be "header" for an API Gateway API.
        'x-amazon-apigateway-authtype': 'oauth2', // Specifies the authorization mechanism for the client.
        'x-amazon-apigateway-authorizer': {
          // An API Gateway Lambda authorizer definition
          type: 'token', // Required property and the value must "token"
          ...(func
            ? {
                authorizerUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${
                  func.children.fn.arn
                }/invocations`
              }
            : {}),
          authorizerResultTtlInSeconds: 60,
          ...authorizerParams
        }
      }
    }
  }
}

// "public" function
function getSwaggerDefinition(name, roleArn, routes, accountId, region = 'us-east-1') {
  let paths = {}
  const securityDefinitions = {}

  // TODO: udpate code to be functional
  forEachObjIndexed((methods, path) => {
    let updatedMethods = {}
    const normalizedPath = getNormalizedPath(path)
    let enableCorsOnPath = false

    forEachObjIndexed((methodObject, method) => {
      const func = resolve(methodObject.function)
      const funcArn = `arn:aws:lambda:${region}:${accountId}:function:${func.functionName}`
      const normalizedMethod = getNormalizedMethod(method)
      const uri = `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${funcArn}/invocations`

      let isCorsEnabled
      if (methodObject.cors) {
        isCorsEnabled = true
        enableCorsOnPath = true
      } else {
        isCorsEnabled = false
      }

      const apiGatewayIntegration = getApiGatewayIntegration(roleArn, uri, isCorsEnabled)
      const securityDefinition = getSecurityDefinition(
        methodObject.authorizer,
        name,
        undefined,
        normalizedPath,
        normalizedMethod
      )
      const defaultResponses = getDefaultResponses(isCorsEnabled)
      updatedMethods = set([normalizedMethod], apiGatewayIntegration, updatedMethods)
      updatedMethods = set([normalizedMethod, 'responses'], defaultResponses, updatedMethods)
      if (securityDefinition) {
        updatedMethods = set(
          [normalizedMethod, 'security'],
          [{ [securityDefinition.name]: [] }],
          updatedMethods
        )
        securityDefinitions[securityDefinition.name] = securityDefinition.definition
      }
    }, or(methods, {}))

    if (enableCorsOnPath) {
      const corsOptionsMethod = getCorsOptionsConfig()
      updatedMethods = set('options', corsOptionsMethod, updatedMethods)
    }

    // set the paths
    paths = set([normalizedPath], updatedMethods, paths)
  }, or(routes, {}))

  const definition = {
    swagger: '2.0',
    info: {
      title: name,
      version: new Date().toISOString()
    },
    schemes: ['https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions,
    paths
  }
  return definition
}

const normalizeRoutes = (flatRoutes) => {
  const catchallParameterPattern = /{\.{3}([^}]+?)}/g
  return reduce(
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
    flatRoutes
  )
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

export { getSwaggerDefinition, flattenRoutes, normalizeRoutes }
