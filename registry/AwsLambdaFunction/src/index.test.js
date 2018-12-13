import AWS from 'aws-sdk'
import path from 'path'
import { tmpdir } from 'os'
import { packDir } from '@serverless/utils'
import { readFileSync } from 'fs'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

jest.setTimeout(30000)

jest.mock('@serverless/utils', () => ({
  ...require.requireActual('@serverless/utils'),
  packDir: jest.fn()
}))

jest.mock('fs', () => ({
  ...require.requireActual('fs'),
  readFileSync: jest.fn().mockReturnValue('zipfilecontent')
}))

jest.mock('folder-hash', () => ({
  hashElement: jest.fn().mockReturnValue({ hash: 'abc' })
}))

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsLambdaFunction', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let AwsProvider
  let AwsLambdaFunction
  let provider

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    AwsProvider = await context.import('AwsProvider')
    AwsLambdaFunction = await context.import('./')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should pack lambda without shim', async () => {
    Date.now = jest.fn(() => '1')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      handler: 'index.hello',
      runtime: 'nodejs8.10'
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.instanceId = 'instanceId'

    const file = await awsLambdaFunction.pack()

    const outputFileName = `${awsLambdaFunction.instanceId}-1.zip`
    const outputFilePath = path.join(tmpdir(), outputFileName)

    expect(packDir).toBeCalledWith('./code', outputFilePath, [])
    expect(readFileSync).toBeCalledWith(outputFilePath)
    expect(awsLambdaFunction.zip).toEqual('zipfilecontent')
    expect(awsLambdaFunction.code).toEqual('./code')
    expect(file).toEqual('zipfilecontent')

    Date.now.mockRestore()
  })

  it('should pack lambda with shim', async () => {
    Date.now = jest.fn(() => '1')
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: ['./code', './shim/path.js'],
      functionName: 'hello',
      handler: 'index.hello',
      runtime: 'nodejs8.10'
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.instanceId = 'instanceId'

    const file = await awsLambdaFunction.pack()

    const outputFileName = `${awsLambdaFunction.instanceId}-1.zip`
    const outputFilePath = path.join(tmpdir(), outputFileName)

    expect(packDir).toBeCalledWith('./code', outputFilePath, ['./shim/path.js'])
    expect(readFileSync).toBeCalledWith(outputFilePath)
    expect(awsLambdaFunction.zip).toEqual('zipfilecontent')
    expect(awsLambdaFunction.code).toEqual(['./code', './shim/path.js'])
    expect(file).toEqual('zipfilecontent')

    Date.now.mockRestore()
  })

  it('should create lambda when non exists', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const createFunctionParams = {
      FunctionName: awsLambdaFunction.functionName,
      Code: {
        ZipFile: awsLambdaFunction.zip
      },
      Description: awsLambdaFunction.functionDescription,
      Handler: awsLambdaFunction.handler,
      MemorySize: awsLambdaFunction.memorySize,
      Publish: true,
      Role: awsLambdaFunction.role.arn,
      Runtime: awsLambdaFunction.runtime,
      Timeout: awsLambdaFunction.timeout,
      Environment: {
        Variables: awsLambdaFunction.environment
      }
    }
    expect(awsLambdaFunction.pack).toHaveBeenCalled()
    expect(awsLambdaFunction.arn).toEqual('abc:zxc')
    expect(AWS.mocks.createFunctionMock).toBeCalledWith(createFunctionParams)
  })

  it('should update lambda config', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 1024, // changed!
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentEvaluables(nextAwsLambdaFunction)

    await nextAwsLambdaFunction.deploy(prevAwsLambdaFunction, context)

    const updateFunctionConfigurationParams = {
      FunctionName: nextAwsLambdaFunction.functionName,
      Description: nextAwsLambdaFunction.functionDescription,
      Handler: nextAwsLambdaFunction.handler,
      MemorySize: nextAwsLambdaFunction.memorySize,
      Role: nextAwsLambdaFunction.role.arn,
      Runtime: nextAwsLambdaFunction.runtime,
      Timeout: nextAwsLambdaFunction.timeout,
      Environment: {
        Variables: nextAwsLambdaFunction.environment
      }
    }

    const updateFunctionCodeParams = {
      FunctionName: nextAwsLambdaFunction.functionName,
      ZipFile: nextAwsLambdaFunction.zip,
      Publish: true
    }

    expect(awsLambdaFunction.pack).toHaveBeenCalled()
    expect(awsLambdaFunction.arn).toEqual('abc:zxc')
    expect(AWS.mocks.updateFunctionCodeMock).toBeCalledWith(updateFunctionCodeParams)
    expect(AWS.mocks.updateFunctionConfigurationMock).toBeCalledWith(
      updateFunctionConfigurationParams
    )
  })

  it('should preserve properties when hydrated', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)
    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)
    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    expect(prevAwsLambdaFunction.arn).toBe('abc:zxc')

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentEvaluables(nextAwsLambdaFunction)
    expect(nextAwsLambdaFunction).toEqual(prevAwsLambdaFunction)
  })

  it('should create lambda if name changed', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'world', // changed!
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentEvaluables(nextAwsLambdaFunction)

    await nextAwsLambdaFunction.deploy(prevAwsLambdaFunction, context)

    const createFunctionParams = {
      FunctionName: nextAwsLambdaFunction.functionName,
      Code: {
        ZipFile: nextAwsLambdaFunction.zip
      },
      Description: nextAwsLambdaFunction.functionDescription,
      Handler: nextAwsLambdaFunction.handler,
      MemorySize: nextAwsLambdaFunction.memorySize,
      Publish: true,
      Role: nextAwsLambdaFunction.role.arn,
      Runtime: nextAwsLambdaFunction.runtime,
      Timeout: nextAwsLambdaFunction.timeout,
      Environment: {
        Variables: nextAwsLambdaFunction.environment
      }
    }

    expect(awsLambdaFunction.pack).toHaveBeenCalled()
    expect(awsLambdaFunction.arn).toEqual('abc:zxc')
    expect(AWS.mocks.createFunctionMock).toBeCalledWith(createFunctionParams)
  })

  it('should create lambda when code is an archive', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: 'codeasarchive.jar',
      functionName: 'hello',
      functionDescription: 'description ok',
      handler: 'index.handler',
      zip: 'zipfilecontent_ok',
      runtime: 'java8',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const createFunctionParams = {
      FunctionName: awsLambdaFunction.functionName,
      Code: {
        ZipFile: awsLambdaFunction.zip
      },
      Description: awsLambdaFunction.functionDescription,
      Handler: awsLambdaFunction.handler,
      MemorySize: awsLambdaFunction.memorySize,
      Publish: true,
      Role: awsLambdaFunction.role.arn,
      Runtime: awsLambdaFunction.runtime,
      Timeout: awsLambdaFunction.timeout,
      Environment: {
        Variables: awsLambdaFunction.environment
      }
    }

    expect(awsLambdaFunction.pack).not.toHaveBeenCalled()
    expect(awsLambdaFunction.arn).toEqual('abc:zxc')
    expect(AWS.mocks.createFunctionMock).toBeCalledWith(createFunctionParams)
  })

  it('should remove lambda', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    await prevAwsLambdaFunction.remove(context)

    const deleteFunctionParams = {
      FunctionName: awsLambdaFunction.functionName
    }

    expect(AWS.mocks.deleteFunctionMock).toBeCalledWith(deleteFunctionParams)
  })

  it('should remove lambda even if it does not exist anymore', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'already-removed-function',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    await prevAwsLambdaFunction.remove(context)

    const deleteFunctionParams = {
      FunctionName: awsLambdaFunction.functionName
    }

    expect(AWS.mocks.deleteFunctionMock).toBeCalledWith(deleteFunctionParams)
  })

  it('should return lambda arn when calling getId()', async () => {
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      handler: 'index.handler',
      runtime: 'nodejs8.10'
    })

    awsLambdaFunction.arn = 'some:arn'

    expect(awsLambdaFunction.getId()).toEqual('some:arn')
  })

  it('shouldDeploy should return replace if name changed', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'world', // changed!
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentEvaluables(nextAwsLambdaFunction)

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe('replace')
  })

  it('shouldDeploy should return deploy if config changed', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 1024, // changed!
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentEvaluables(nextAwsLambdaFunction)

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe('deploy')
  })

  it('shouldDeploy should return undefined if nothing changed', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.shouldDeploy(null, context)
    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentEvaluables(nextAwsLambdaFunction)

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe(undefined)
  })

  it('shouldDeploy should return deploy if role changed', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        roleName: 'newRoleName', // changed
        arn: 'abc:aws:new' // changed
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentEvaluables(nextAwsLambdaFunction)

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe('deploy')
  })

  it('shouldDeploy should return deploy if code changed', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentEvaluables(nextAwsLambdaFunction)
    nextAwsLambdaFunction.hash = 'newHash'

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe('deploy')
  })

  it('should not load AwsIamRole if role is provided', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      },
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    const children = await awsLambdaFunction.define(context)

    expect(children.role.roleName).toBe('roleName')
  })

  it('should load AwsIamRole if role is not provided', async () => {
    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      functionDescription: 'hello description',
      handler: 'index.handler',
      zip: 'zipfilecontent',
      runtime: 'nodejs8.10',
      memorySize: 512,
      timeout: 10,
      environment: {
        ENV_VAR: 'env value'
      },
      tags: {
        foo: 'bar'
      }
    })

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentEvaluables(awsLambdaFunction)

    const children = await awsLambdaFunction.define(context)
    const role = resolveComponentEvaluables(children.role)
    expect(role.roleName).toBe(`${awsLambdaFunction.functionName}-execution-role`)
    expect(role.policy).toEqual({
      Version: '2012-10-17',
      Statement: [
        {
          Action: ['logs:CreateLogStream'],
          Resource: [
            `arn:aws:logs:us-east-1:558750028299:log-group:/aws/lambda/${
              awsLambdaFunction.functionName
            }:*`
          ],
          Effect: 'Allow'
        },
        {
          Action: ['logs:PutLogEvents'],
          Resource: [
            `arn:aws:logs:us-east-1:558750028299:log-group:/aws/lambda/${
              awsLambdaFunction.functionName
            }:*:*`
          ],
          Effect: 'Allow'
        }
      ]
    })
  })
})
