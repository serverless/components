import AWS from 'aws-sdk'
import path from 'path'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

// todo mock timers
jest.setTimeout(16000)

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsApiGateway', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let provider
  let AwsApiGateway

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    AwsApiGateway = await context.import('AwsApiGateway')
    const AwsProvider = await context.import('AwsProvider')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should create ApiGateway if first deployment', async () => {
    const inputs = {
      provider,
      name: 'something',
      role: { arn: 'someArn' },
      routes: {}
    }

    let awsApiGateway = await context.construct(AwsApiGateway, inputs)
    awsApiGateway = resolveComponentEvaluables(awsApiGateway)

    await awsApiGateway.deploy(undefined, context)

    const createDeploymentParams = {
      restApiId: 'my-new-id',
      stageName: 'dev'
    }

    expect(AWS.mocks.importRestApiMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createDeploymentMock).toBeCalledWith(createDeploymentParams)
    expect(awsApiGateway.id).toEqual('my-new-id')
  })

  it('should update service if changed', async () => {
    const inputs = {
      provider,
      name: 'somethingNew',
      role: { arn: 'someArn' },
      routes: {}
    }

    let awsApiGateway = await context.construct(AwsApiGateway, inputs)
    awsApiGateway = resolveComponentEvaluables(awsApiGateway)

    const prevInstance = {
      apiName: 'something',
      id: 'new-new-id',
      url: 'http://example.com/'
    }

    await awsApiGateway.deploy(prevInstance, context)

    expect(AWS.mocks.putRestApiMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createDeploymentMock).toBeCalledWith({
      restApiId: prevInstance.id,
      stageName: 'dev'
    })
  })

  it('should preserve props if nothing changed', async () => {
    const inputs = {
      provider,
      apiName: 'somethingNew',
      role: { arn: 'someArn' },
      routes: {}
    }
    let oldComponent = await context.construct(AwsApiGateway, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(AwsApiGateway, inputs)
    newComponent = await context.defineComponent(newComponent, prevComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    expect(newComponent).toEqual(prevComponent)
  })

  it('should remove deployment', async () => {
    const inputs = {
      provider,
      name: 'somethingNew',
      role: { arn: 'someArn' },
      routes: {}
    }
    const prevInstance = {
      provider,
      id: 'something'
    }

    const awsApiGateway = await context.construct(AwsApiGateway, inputs)
    Object.assign(awsApiGateway, prevInstance)

    await awsApiGateway.remove(context)

    expect(AWS.mocks.deleteRestApiMock).toBeCalledWith({ restApiId: prevInstance.id })
  })

  it('should remove the deployment even if it does not exist anymore', async () => {
    let oldAwsApiGateway = await context.construct(AwsApiGateway, {
      provider,
      name: 'some-api-name',
      role: { arn: 'arn:aws:iam::XXXXX:role/some-role-name' },
      routes: {}
    })
    oldAwsApiGateway = await context.defineComponent(oldAwsApiGateway)
    oldAwsApiGateway = resolveComponentEvaluables(oldAwsApiGateway)
    await oldAwsApiGateway.deploy(null, context)

    const prevAwsApiGateway = await deserialize(serialize(oldAwsApiGateway, context), context)
    prevAwsApiGateway.id = 'already-removed-rest-api'
    await prevAwsApiGateway.remove(context)

    expect(AWS.mocks.deleteRestApiMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRestApiMock).toBeCalledWith({
      restApiId: prevAwsApiGateway.id
    })
  })

  it('shouldDeploy should return undefined if nothing changed', async () => {
    const inputs = {
      provider,
      apiName: 'somethingNew',
      role: { arn: 'someArn' },
      routes: {}
    }
    let oldComponent = await context.construct(AwsApiGateway, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(AwsApiGateway, inputs)
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe(undefined)
  })

  it('shouldDeploy should return replace if name changed', async () => {
    const inputs = {
      provider,
      apiName: 'somethingOld',
      role: { arn: 'someArn' },
      routes: {}
    }
    let oldComponent = await context.construct(AwsApiGateway, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(AwsApiGateway, {
      ...inputs,
      apiName: 'somethingNew'
    })
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe('replace')
  })

  it('shouldDeploy should return deploy if routes changed', async () => {
    const inputs = {
      provider,
      apiName: 'something',
      role: { arn: 'someArn' },
      routes: { '/path': null }
    }
    let oldComponent = await context.construct(AwsApiGateway, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(AwsApiGateway, {
      ...inputs,
      routes: { '/anotherPath': null }
    })
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe('deploy')
  })

  it('shouldDeploy should return deploy if first deployment', async () => {
    const inputs = {
      provider,
      apiName: 'something',
      role: { arn: 'someArn' },
      routes: { '/another': null }
    }
    let oldAwsApiGateway = await context.construct(AwsApiGateway, inputs)
    oldAwsApiGateway = await context.defineComponent(oldAwsApiGateway)
    oldAwsApiGateway = resolveComponentEvaluables(oldAwsApiGateway)
    const res = oldAwsApiGateway.shouldDeploy(null, context)
    expect(res).toBe('deploy')
  })
})
