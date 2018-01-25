module.exports = (name, lambdaArn, path, method, apiRoleArn) => {
  const normalizedPath = `/${path.replace(/^\/+/, '')}`
  const normalizedMethod = method.toLowerCase()
  const uri = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`

  const paths = {
    [normalizedPath]: {
      [normalizedMethod]: {
        'x-amazon-apigateway-integration': {
          type: 'aws_proxy',
          httpMethod: 'POST',
          credentials: apiRoleArn,
          uri,
          responses: {
            default: {
              statusCode: '200'
            }
          }
        }
      }
    }
  }
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
