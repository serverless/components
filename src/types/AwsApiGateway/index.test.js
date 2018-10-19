const ComponentType = require('./index')

// todo mock timers
jest.setTimeout(16000)

class SuperClass {
  constructor(inputs) {
    this.provider = inputs.provider
    this.roleName = inputs.roleName
    this.service = inputs.service
    this.policy = inputs.policy
  }
}

const SuperContext = {
  loadType: async () => {}
}

const mocks = {
  importRestApi: jest.fn().mockReturnValue({ id: 'my-new-id' }),
  createDeployment: jest.fn(),
  putRestApi: jest.fn(),
  deleteRestApi: jest.fn()
}

const context = {
  get: () => {},
  log: () => {}
}

const provider = {
  getSdk: () => {
    return {
      APIGateway: function() {
        return {
          importRestApi: (obj) => ({ promise: () => mocks.importRestApi(obj) }),
          createDeployment: (obj) => ({ promise: () => mocks.createDeployment(obj) }),
          putRestApi: (obj) => ({ promise: () => mocks.putRestApi(obj) }),
          deleteRestApi: (obj) => ({ promise: () => mocks.deleteRestApi(obj) })
        }
      }
    }
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsApiGateway', () => {
  it('should create ApiGateway if first deployment', async () => {
    const inputs = {
      name: 'something',
      role: { arn: 'someArn' },
      routes: {}
    }
    let awsApiGateway = await ComponentType(SuperClass, SuperContext)
    awsApiGateway = new awsApiGateway(inputs, context)

    await awsApiGateway.deploy(undefined, context)

    const importRestApiParams = Buffer.from(
      JSON.stringify({
        swagger: '2.0',
        info: {
          title: inputs.name,
          version: new Date().toISOString()
        },
        schemes: ['https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        // securityDefinitions: {
        //   MyNewAPI: {
        //     type: 'apiKey',
        //     name: 'Authorization',
        //     in: 'header',
        //     'x-amazon-apigateway-authtype': 'oauth2',
        //     'x-amazon-apigateway-authorizer': {
        //       type: 'TOKEN',
        //       authorizerUri:
        //         'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:211551830235:function:somethinga/invocations',
        //       authorizerResultTtlInSeconds: 60,
        //       identitySource: 'method.request.header.Auth'
        //     }
        //   }
        // },
        paths: {
          // '/something': {
          //   get: {
          //     'x-amazon-apigateway-integration': {
          //       type: 'aws_proxy',
          //       httpMethod: 'POST',
          //       credentials: 'arn:aws:iam::211551830235:role/MyNewAPI-iam-role-fbs59d',
          //       uri:
          //         'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:211551830235:function:somethinga/invocations',
          //       responses: {
          //         default: {
          //           statusCode: '200'
          //         }
          //       }
          //     },
          //     responses: {
          //       '200': {
          //         description: 'Success'
          //       }
          //     },
          //     security: [
          //       {
          //         MyNewAPI: []
          //       }
          //     ]
          //   }
          // }
        }
      }),
      'utf8'
    )

    const createDeploymentParams = {
      restApiId: 'my-new-id',
      stageName: 'dev'
    }

    expect(mocks.importRestApi).toBeCalledWith(importRestApiParams)
    expect(mocks.createDeployment).toBeCalledWith(createDeploymentParams)
    expect(awsApiGateway.id).toEqual('my-new-id')
  })

  it('should update service if changed', async () => {
    const inputs = {
      name: 'somethingNew',
      role: { arn: 'someArn' },
      routes: {}
    }
    let awsApiGateway = await ComponentType(SuperClass, SuperContext)
    awsApiGateway = new awsApiGateway(inputs, context)

    const prevInstance = {
      name: 'something',
      id: 'new-new-id',
      url: 'http://example.com/'
    }

    const importRestApiParams = Buffer.from(
      JSON.stringify({
        swagger: '2.0',
        info: {
          title: inputs.name,
          version: new Date().toISOString()
        },
        schemes: ['https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        // securityDefinitions: {
        //   MyNewAPI: {
        //     type: 'apiKey',
        //     name: 'Authorization',
        //     in: 'header',
        //     'x-amazon-apigateway-authtype': 'oauth2',
        //     'x-amazon-apigateway-authorizer': {
        //       type: 'TOKEN',
        //       authorizerUri:
        //         'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:211551830235:function:somethinga/invocations',
        //       authorizerResultTtlInSeconds: 60,
        //       identitySource: 'method.request.header.Auth'
        //     }
        //   }
        // },
        paths: {
          // '/something': {
          //   get: {
          //     'x-amazon-apigateway-integration': {
          //       type: 'aws_proxy',
          //       httpMethod: 'POST',
          //       credentials: 'arn:aws:iam::211551830235:role/MyNewAPI-iam-role-fbs59d',
          //       uri:
          //         'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:211551830235:function:somethinga/invocations',
          //       responses: {
          //         default: {
          //           statusCode: '200'
          //         }
          //       }
          //     },
          //     responses: {
          //       '200': {
          //         description: 'Success'
          //       }
          //     },
          //     security: [
          //       {
          //         MyNewAPI: []
          //       }
          //     ]
          //   }
          // }
        }
      }),
      'utf8'
    )

    await awsApiGateway.deploy(prevInstance, context)

    expect(mocks.putRestApi).toBeCalledWith({
      restApiId: prevInstance.id,
      body: importRestApiParams
    })
    expect(mocks.createDeployment).toBeCalledWith({ restApiId: prevInstance.id, stageName: 'dev' })
  })

  it('should remove deployment', async () => {
    const prevInstance = {
      provider,
      id: 'something'
    }
    let awsApiGateway = await ComponentType(SuperClass, SuperContext)
    awsApiGateway = new awsApiGateway(prevInstance, context)

    await awsApiGateway.remove(context)

    expect(mocks.deleteRestApi).toBeCalledWith({
      restApiId: prevInstance.id
    })
  })
})
