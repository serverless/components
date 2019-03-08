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

function getApiGatewayIntegration(roleArn, uri, useCors, type) {
  const apiGatewayIntegration = {
    'x-amazon-apigateway-integration': {
      type: type || 'aws_proxy',
      httpMethod: 'POST',
      credentials: roleArn,
      uri: uri,
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
function getSwaggerDefinition(name, roleArn, routes, securityDefinitions, definitions, params) {

  let paths = {}

  // TODO: udpate code to be functional
  forEachObjIndexed((methods, path) => {
    let updatedMethods = {}
    const normalizedPath = getNormalizedPath(path)
    let enableCorsOnPath = false

    forEachObjIndexed((methodObject, method) => {
      const normalizedMethod = getNormalizedMethod(method)

      let isCorsEnabled
      if (methodObject.cors) {
        isCorsEnabled = true
        enableCorsOnPath = true
      } else {
        let res = methodObject['x-amazon-apigateway-integration'].responses['200']
        if (res != undefined) {
          if (res.responseParameters['method.response.header.Access-Control-Allow-Origin'] == '\'*\'') {
            isCorsEnabled = true
          }
        }
      }

      let apiGatewayIntegration
      if (methodObject['x-amazon-apigateway-integration']) {
        apiGatewayIntegration = {
          'x-amazon-apigateway-integration': {
            type: 'http',
            httpMethod: 'POST',
            credentials: roleArn,
            ...methodObject['x-amazon-apigateway-integration']
          }
        }
      } else {
        apiGatewayIntegration = getApiGatewayIntegration(roleArn, params.uri, isCorsEnabled)
      }

      let defaultResponses
      if (methodObject.responses) {
        defaultResponses = methodObject.responses
      } else {
        defaultResponses = getDefaultResponses(isCorsEnabled)
      }

      const parameters = methodObject.parameters
      const tags = methodObject.tags
      const summary = methodObject.summary
      const validator = methodObject['x-amazon-apigateway-request-validator']

      updatedMethods = set(lensPath([normalizedMethod]), apiGatewayIntegration, updatedMethods)
      updatedMethods = set(
        lensPath([normalizedMethod, 'responses']),
        defaultResponses,
        updatedMethods
      )
      updatedMethods = set(
        lensPath([normalizedMethod, 'parameters']),
        parameters,
        updatedMethods
      )
      updatedMethods = set(
        lensPath([normalizedMethod, 'tags']),
        tags,
        updatedMethods
      )
      updatedMethods = set(
        lensPath([normalizedMethod, 'summary']),
        summary,
        updatedMethods
      )
      updatedMethods = set(
        lensPath([normalizedMethod, 'x-amazon-apigateway-request-validator']),
        validator,
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
    paths,
    securityDefinitions: securityDefinitions,
    definitions: definitions,
    'x-amazon-apigateway-documentation': params['x-amazon-apigateway-documentation'],
    'x-amazon-apigateway-gateway-responses': params['x-amazon-apigateway-gateway-responses'],
    'x-amazon-apigateway-request-validators': params['x-amazon-apigateway-request-validators']
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
