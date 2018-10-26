import { forEachObjIndexed, keys, map, set, lensPath } from '@serverless/utils'

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
      lensPath(['x-amazon-apigateway-integration', 'responses', 'default', 'responseParameters']),
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

function getSecurityDefinition(authorizerObj, name, region = 'us-east-1' /*, path , method */) {
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
function getSwaggerDefinition(name, roleArn, routes) {
  let paths = {}
  const securityDefinitions = {}

  // TODO: udpate code to be functional
  forEachObjIndexed((methods, path) => {
    let updatedMethods = {}
    const normalizedPath = getNormalizedPath(path)
    let enableCorsOnPath = false

    forEachObjIndexed((methodObject, method) => {
      const normalizedMethod = getNormalizedMethod(method)
      const uri = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${
        methodObject.function.children.fn.arn
      }/invocations`

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
      updatedMethods = set(
        lensPath([normalizedMethod, 'responses']),
        defaultResponses,
        updatedMethods
      )
      if (securityDefinition) {
        updatedMethods = set(
          lensPath([normalizedMethod, 'security']),
          [{ [securityDefinition.name]: [] }],
          updatedMethods
        )
        securityDefinitions[securityDefinition.name] = securityDefinition.definition
      }
    }, methods)

    if (enableCorsOnPath) {
      const corsOptionsMethod = getCorsOptionsConfig()
      updatedMethods = set(['options'], corsOptionsMethod, updatedMethods)
    }

    // set the paths
    paths = set([normalizedPath], updatedMethods, paths)
  }, routes)

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

function generateUrl(id, region = 'us-east-1', stage = 'dev') {
  return `https://${id}.execute-api.${region}.amazonaws.com/${stage}/`
}

function generateUrls(routes, restApiId) {
  const paths = keys(routes)
  return map((path) => {
    const baseUrl = generateUrl(restApiId)
    return `${baseUrl}${path.replace(/^\/+/, '')}`
  }, paths)
}

export { getSwaggerDefinition, generateUrl, generateUrls }
