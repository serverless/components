const { mapObjIndexed, keys, map } = require('ramda')

// TODO: remove hardcoding of region (e.g. like us-east-1)

function getSwaggerDefinition(name, roleArn, routes) {
  const arnParts = roleArn.match(new RegExp('(.+):(.+):(.+):(.*):(.+)'))

  // TODO: normalize paths and methods
  const paths = mapObjIndexed(
    (methodObjects) =>
      mapObjIndexed((methodObject) => {
        const func = methodObject.function
        const lambdaArn = `arn:aws:lambda:us-east-1:${arnParts[4]}:function:${func}`
        const uri = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`
        return {
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
      }, methodObjects),
    routes
  )

  const definition = {
    swagger: '2.0',
    info: {
      title: name,
      version: new Date().toISOString()
    },
    schemes: [ 'https' ],
    consumes: [ 'application/json' ],
    produces: [ 'application/json' ],
    paths
  }
  return definition
}

function generateUrls(routes, restApiId) {
  const paths = keys(routes)
  return map(
    (path) =>
      `https://${restApiId}.execute-api.us-east-1.amazonaws.com/dev/${path.replace(/^\/+/, '')}`,
    paths
  )
}

module.exports = {
  getSwaggerDefinition,
  generateUrls
}
