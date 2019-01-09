import AWS from 'aws-sdk'
import path from 'path'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsApiGateway', () => {
  const cwd = path.resolve(__dirname, '..')
  const swaggerTemplate = {
    swagger: '0.2',
    info: {
      title: 'some-swagger-template'
    },
    schemes: ['https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {},
    paths: {
      'foo/bar': {
        get: {
          responses: { '200': { description: 'Success' } },
          'x-amazon-apigateway-integration': {
            credentials: 'arn:aws:iam::XXXXX:role/some-role-name',
            httpMethod: 'POST',
            responses: { default: { statusCode: '200' } },
            type: 'aws_proxy',
            uri:
              'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:558750028299:function:funcOne/invocations'
          }
        }
      }
    }
  }
  let context
  let provider
  let inputs
  let AwsApiGateway

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    AwsApiGateway = await context.import('AwsApiGateway')
    const AwsProvider = await context.import('AwsProvider')
    provider = context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
    inputs = {
      provider,
      swaggerTemplate,
      stage: 'dev'
    }
  })

  describe('#hydrate()', () => {
    it('should preserve props if nothing changed', async () => {
      let oldComponent = context.construct(AwsApiGateway, inputs)
      oldComponent = await context.defineComponent(oldComponent)
      oldComponent = resolveComponentEvaluables(oldComponent)
      await oldComponent.deploy(null, context)

      const prevComponent = await deserialize(serialize(oldComponent, context), context)

      let newComponent = context.construct(AwsApiGateway, inputs)
      newComponent = await context.defineComponent(newComponent, prevComponent)
      newComponent = resolveComponentEvaluables(newComponent)

      expect(newComponent).toEqual(prevComponent)
    })
  })

  describe('#sync()', () => {
    it('should return "removed" when the id is not set', async () => {
      let component = context.construct(AwsApiGateway, inputs)
      component = await context.defineComponent(component)
      component = resolveComponentEvaluables(component)
      component.id = undefined

      const res = await component.sync()

      expect(AWS.mocks.getExportMock).not.toHaveBeenCalled()
      expect(res).toEqual('removed')
    })

    it('should return "removed" if the API is not present', async () => {
      let component = context.construct(AwsApiGateway, inputs)
      component = await context.defineComponent(component)
      component = resolveComponentEvaluables(component)
      component.id = 'already-removed-rest-api'

      const res = await component.sync()

      expect(AWS.mocks.getExportMock).toHaveBeenCalledTimes(1)
      expect(res).toEqual('removed')
    })

    it('should verify that an API is present', async () => {
      let component = context.construct(AwsApiGateway, inputs)
      component = await context.defineComponent(component)
      component = resolveComponentEvaluables(component)
      component.id = 'some-rest-api'

      const res = await component.sync()

      expect(AWS.mocks.getExportMock).toHaveBeenCalledTimes(1)
      expect(res).toEqual(undefined)
    })
  })

  describe('#shouldDeploy()', () => {
    it('should return undefined if nothing changed', async () => {
      let oldComponent = context.construct(AwsApiGateway, inputs)
      oldComponent = await context.defineComponent(oldComponent)
      oldComponent = resolveComponentEvaluables(oldComponent)
      await oldComponent.deploy(null, context)

      const prevComponent = await deserialize(serialize(oldComponent, context), context)

      let newComponent = context.construct(AwsApiGateway, inputs)
      newComponent = await context.defineComponent(newComponent)
      newComponent = resolveComponentEvaluables(newComponent)

      const res = newComponent.shouldDeploy(prevComponent)
      expect(res).toBe(undefined)
    })

    it('should return deploy if config changed', async () => {
      let oldComponent = context.construct(AwsApiGateway, inputs)
      oldComponent = await context.defineComponent(oldComponent)
      oldComponent = resolveComponentEvaluables(oldComponent)
      await oldComponent.deploy(null, context)

      const prevComponent = await deserialize(serialize(oldComponent, context), context)

      let newComponent = context.construct(AwsApiGateway, {
        ...inputs,
        stage: 'prod'
      })
      newComponent = await context.defineComponent(newComponent)
      newComponent = resolveComponentEvaluables(newComponent)

      const res = newComponent.shouldDeploy(prevComponent)
      expect(res).toBe('deploy')
    })

    it('should return deploy if first deployment', async () => {
      let component = context.construct(AwsApiGateway, inputs)
      component = await context.defineComponent(component)
      component = resolveComponentEvaluables(component)
      const res = component.shouldDeploy(null, context)
      expect(res).toBe('deploy')
    })
  })

  describe('#deploy()', () => {
    it('should create ApiGateway if first deployment', async () => {
      let component = context.construct(AwsApiGateway, inputs)
      component = resolveComponentEvaluables(component)

      await component.deploy(undefined, context)

      const createDeploymentParams = {
        restApiId: 'some-rest-api-id',
        stageName: 'dev'
      }

      expect(AWS.mocks.importRestApiMock).toHaveBeenCalledTimes(1)
      expect(AWS.mocks.createDeploymentMock).toBeCalledWith(createDeploymentParams)
      expect(component.id).toEqual('some-rest-api-id')
      expect(component.stage).toEqual('dev')
      expect(component.baseUrl).toEqual(
        `https://${component.id}.execute-api.us-east-1.amazonaws.com/${component.stage}/`
      )
      expect(component.urls).toEqual(['foo/bar'])
    })

    it('should update service if changed', async () => {
      let component = context.construct(AwsApiGateway, inputs)
      component = resolveComponentEvaluables(component)

      const prevInstance = {
        id: 'some-rest-api-id'
      }

      await component.deploy(prevInstance, context)

      expect(AWS.mocks.putRestApiMock).toHaveBeenCalledTimes(1)
      expect(AWS.mocks.createDeploymentMock).toBeCalledWith({
        restApiId: prevInstance.id,
        stageName: 'dev'
      })
      expect(component.id).toEqual('some-rest-api-id')
      expect(component.stage).toEqual('dev')
      expect(component.baseUrl).toEqual(
        `https://${component.id}.execute-api.us-east-1.amazonaws.com/${component.stage}/`
      )
      expect(component.urls).toEqual(['foo/bar'])
    })
  })

  describe('#remove()', () => {
    it('should remove deployment', async () => {
      const prevInstance = {
        provider,
        swaggerTemplate,
        id: 'some-rest-api-id'
      }

      const component = context.construct(AwsApiGateway, inputs)
      Object.assign(component, prevInstance)

      await component.remove(context)

      expect(AWS.mocks.deleteRestApiMock).toHaveBeenCalledTimes(1)
      expect(AWS.mocks.deleteRestApiMock).toBeCalledWith({ restApiId: prevInstance.id })
    })

    it('should remove the deployment even if it does not exist anymore', async () => {
      let component = context.construct(AwsApiGateway, {
        provider,
        swaggerTemplate
      })
      component = await context.defineComponent(component)
      component = resolveComponentEvaluables(component)
      await component.deploy(null, context)

      const oldComponent = await deserialize(serialize(component, context), context)
      oldComponent.id = 'already-removed-rest-api'
      await oldComponent.remove(context)

      expect(AWS.mocks.deleteRestApiMock).toHaveBeenCalledTimes(1)
      expect(AWS.mocks.deleteRestApiMock).toBeCalledWith({
        restApiId: oldComponent.id
      })
    })
  })
})
