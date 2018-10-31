import AWS from 'aws-sdk'
import path from 'path'
import { tmpdir } from 'os'
import { packDir } from '@serverless/utils'
import { readFileSync } from 'fs'
import {
  createContext,
  deserialize,
  resolveComponentVariables,
  serialize
} from '../../../src/utils'

jest.setTimeout(10000)

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

const createTestContext = async () =>
  createContext(
    {
      cwd: path.join(__dirname, '..'),
      overrides: {
        debug: () => {},
        log: () => {}
      }
    },
    {
      app: {
        id: 'test'
      }
    }
  )

describe('AwsLambdaFunction', () => {
  it('should pack lambda without shim', async () => {
    Date.now = jest.fn(() => '1')
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
      code: './code',
      functionName: 'hello'
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

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
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
      code: ['./code', './shim/path.js'],
      functionName: 'hello'
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

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
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

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
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentVariables(nextAwsLambdaFunction)

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

  it('should create lambda if name changed', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentVariables(nextAwsLambdaFunction)

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

  it('should remove lambda', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

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
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const AwsLambdaFunction = await context.loadType('./')
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, {})

    awsLambdaFunction.arn = 'some:arn'

    expect(awsLambdaFunction.getId()).toEqual('some:arn')
  })

  it('shouldDeploy should return replace if name changed', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentVariables(nextAwsLambdaFunction)

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe('replace')
  })

  it('shouldDeploy should return deploy if config changed', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentVariables(nextAwsLambdaFunction)

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe('deploy')
  })

  it('shouldDeploy should return undefined if nothing changed', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentVariables(nextAwsLambdaFunction)

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe(undefined)
  })

  it('shouldDeploy should return deploy if role changed', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        roleName: 'newRoleName', // changed
        arn: 'abc:aws:new' // changed
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentVariables(nextAwsLambdaFunction)

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe('deploy')
  })

  it('shouldDeploy should return deploy if code changed', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

    awsLambdaFunction.pack = jest.fn()

    await awsLambdaFunction.deploy(null, context)

    const prevAwsLambdaFunction = await deserialize(serialize(awsLambdaFunction, context), context)

    let nextAwsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })
    nextAwsLambdaFunction = await context.defineComponent(
      nextAwsLambdaFunction,
      prevAwsLambdaFunction
    )
    nextAwsLambdaFunction = resolveComponentVariables(nextAwsLambdaFunction)
    nextAwsLambdaFunction.hash = 'newHash'

    const result = await nextAwsLambdaFunction.shouldDeploy(prevAwsLambdaFunction, context)

    expect(result).toBe('deploy')
  })

  it('should not load AwsIamRole if role is provided', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc',
      role: {
        roleName: 'roleName',
        arn: 'abc:aws'
      }
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

    const children = await awsLambdaFunction.define(context)

    expect(children.role.roleName).toBe('roleName')
  })

  it('should load AwsIamRole if role is not provided', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsLambdaFunction = await context.loadType('./')

    let awsLambdaFunction = await context.construct(AwsLambdaFunction, {
      provider: await context.construct(AwsProvider, {}),
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
      tags: 'abc'
    })

    awsLambdaFunction['@@key'] = 'hello' // for some reason this does not get auto set!

    awsLambdaFunction = await context.defineComponent(awsLambdaFunction)

    awsLambdaFunction = resolveComponentVariables(awsLambdaFunction)

    const children = await awsLambdaFunction.define(context)

    expect(children.role.roleName).toBe(`${awsLambdaFunction.functionName}-execution-role`)
  })
})
