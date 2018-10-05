const { forEachObjIndexed, keys, map, set, lensPath } = require('ramda')

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
      lensPath([200]),
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

// "public" function
function getSwaggerDefinition(name, roleArn, routes) {
  let paths = {}

  // TODO: udpate code to be functional
  forEachObjIndexed((methods, path) => {
    let updatedMethods = {}
    const normalizedPath = getNormalizedPath(path)
    let enableCorsOnPath = false

    forEachObjIndexed((methodObject, method) => {
      const normalizedMethod = getNormalizedMethod(method)
      const uri = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${
        methodObject.lambdaArn
      }/invocations`

      let isCorsEnabled
      if (methodObject.cors) {
        isCorsEnabled = true
        enableCorsOnPath = true
      } else {
        isCorsEnabled = false
      }

      const apiGatewayIntegration = getApiGatewayIntegration(roleArn, uri, isCorsEnabled)
      const defaultResponses = getDefaultResponses(isCorsEnabled)
      updatedMethods = set(lensPath([normalizedMethod]), apiGatewayIntegration, updatedMethods)
      updatedMethods = set(
        lensPath([normalizedMethod, 'responses']),
        defaultResponses,
        updatedMethods
      )
    }, methods)

    if (enableCorsOnPath) {
      const corsOptionsMethod = getCorsOptionsConfig()
      updatedMethods = set(lensPath(['options']), corsOptionsMethod, updatedMethods)
    }

    // set the paths
    paths = set(lensPath([normalizedPath]), updatedMethods, paths)
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

module.exports = {
  getSwaggerDefinition,
  generateUrl,
  generateUrls
}
