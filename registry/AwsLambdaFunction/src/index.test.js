import path from 'path'
import { tmpdir } from 'os'
import { createContext } from '../../../src/utils'
import { packDir } from '@serverless/utils'
import { readFileSync } from 'fs'

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

const mocks = {
  createFunctionMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  updateFunctionCodeMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  updateFunctionConfigurationMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  deleteFunctionMock: jest.fn()
}

const provider = {
  getSdk: () => {
    return {
      Lambda: function() {
        return {
          createFunction: (obj) => ({
            promise: () => mocks.createFunctionMock(obj)
          }),
          updateFunctionConfiguration: (obj) => ({
            promise: () => mocks.updateFunctionConfigurationMock(obj)
          }),
          updateFunctionCode: (obj) => ({
            promise: () => mocks.updateFunctionCodeMock(obj)
          }),
          deleteFunction: (obj) => ({
            promise: () => mocks.deleteFunctionMock(obj)
          })
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

describe('AwsLambdaFunction', () => {
  it('should pack lambda without shim', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const AwsLambdaFunction = await context.loadType('./')
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, {})

    awsLambdaFunction.code = './code'
    awsLambdaFunction.instanceId = 'instanceId'
    Date.now = jest.fn(() => '1')

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
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const AwsLambdaFunction = await context.loadType('./')
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, {})

    awsLambdaFunction.code = ['./code', './shim/path.js']
    awsLambdaFunction.instanceId = 'instanceId'
    Date.now = jest.fn(() => '1')

    const file = await awsLambdaFunction.pack()

    const outputFileName = `${awsLambdaFunction.instanceId}-1.zip`
    const outputFilePath = path.join(tmpdir(), outputFileName)

    expect(packDir).toBeCalledWith('./code', outputFilePath, ['./shim/path.js'])
    expect(readFileSync).toBeCalledWith(outputFilePath)
    expect(awsLambdaFunction.code).toEqual(awsLambdaFunction.code)
    expect(awsLambdaFunction.zip).toEqual('zipfilecontent')
    expect(file).toEqual('zipfilecontent')

    Date.now.mockRestore()
  })

  it('should create lambda', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const AwsLambdaFunction = await context.loadType('./')
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, {})

    awsLambdaFunction.pack = jest.fn()

    awsLambdaFunction.provider = provider
    awsLambdaFunction.functionName = 'hello'
    awsLambdaFunction.functionDescription = 'hello description'
    awsLambdaFunction.handler = 'index.handler'
    awsLambdaFunction.code = './code'
    awsLambdaFunction.zip = 'zipfilecontent'
    awsLambdaFunction.runtime = 'nodejs8.10'
    awsLambdaFunction.memorySize = 512
    awsLambdaFunction.timeout = 10
    awsLambdaFunction.environment = {
      ENV_VAR: 'env value'
    }
    awsLambdaFunction.tags = 'abc'
    awsLambdaFunction.role = {
      arn: 'some:aws:arn'
    }

    await awsLambdaFunction.deploy(undefined, context)

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
    expect(mocks.createFunctionMock).toBeCalledWith(createFunctionParams)
  })

  it('should update lambda', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const AwsLambdaFunction = await context.loadType('./')
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, {})

    awsLambdaFunction.pack = jest.fn()

    awsLambdaFunction.provider = provider
    awsLambdaFunction.functionName = 'hello'
    awsLambdaFunction.functionDescription = 'hello description'
    awsLambdaFunction.handler = 'index.handler'
    awsLambdaFunction.code = './code'
    awsLambdaFunction.zip = 'zipfilecontent'
    awsLambdaFunction.runtime = 'nodejs8.10'
    awsLambdaFunction.memorySize = 512
    awsLambdaFunction.timeout = 10
    awsLambdaFunction.environment = {
      ENV_VAR: 'env value'
    }
    awsLambdaFunction.tags = 'abc'
    awsLambdaFunction.role = {
      arn: 'some:aws:arn'
    }

    await awsLambdaFunction.deploy({ functionName: 'hello' }, context)

    const updateFunctionConfigurationParams = {
      FunctionName: awsLambdaFunction.functionName,
      Description: awsLambdaFunction.functionDescription,
      Handler: awsLambdaFunction.handler,
      MemorySize: awsLambdaFunction.memorySize,
      Role: awsLambdaFunction.role.arn,
      Runtime: awsLambdaFunction.runtime,
      Timeout: awsLambdaFunction.timeout,
      Environment: {
        Variables: awsLambdaFunction.environment
      }
    }

    const updateFunctionCodeParams = {
      FunctionName: awsLambdaFunction.functionName,
      ZipFile: awsLambdaFunction.zip,
      Publish: true
    }

    expect(awsLambdaFunction.pack).toHaveBeenCalled()
    expect(awsLambdaFunction.arn).toEqual('abc:zxc')
    expect(mocks.updateFunctionCodeMock).toBeCalledWith(updateFunctionCodeParams)
    expect(mocks.updateFunctionConfigurationMock).toBeCalledWith(updateFunctionConfigurationParams)
  })

  it('should remove lambda', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const AwsLambdaFunction = await context.loadType('./')
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, {})

    awsLambdaFunction.provider = provider
    awsLambdaFunction.functionName = 'hello'
    awsLambdaFunction.functionDescription = 'hello description'
    awsLambdaFunction.handler = 'index.handler'
    awsLambdaFunction.code = './code'
    awsLambdaFunction.runtime = 'nodejs8.10'
    awsLambdaFunction.memorySize = 512
    awsLambdaFunction.timeout = 10
    awsLambdaFunction.environment = {
      ENV_VAR: 'env value'
    }
    awsLambdaFunction.tags = 'abc'
    awsLambdaFunction.role = {
      arn: 'some:aws:arn'
    }

    await awsLambdaFunction.remove(context)

    const deleteFunctionParams = {
      FunctionName: awsLambdaFunction.functionName
    }

    expect(mocks.deleteFunctionMock).toBeCalledWith(deleteFunctionParams)
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
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const AwsLambdaFunction = await context.loadType('./')
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, {})

    awsLambdaFunction.functionName = 'hello'
    awsLambdaFunction.role = {
      roleName: 'roleName'
    }

    expect(
      awsLambdaFunction.shouldDeploy({ functionName: 'world', role: { roleName: 'roleName' } })
    ).toEqual('replace')
  })

  it('should define AwsIamRole as child if role is not provided', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const AwsLambdaFunction = await context.loadType('./')
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, {})

    awsLambdaFunction.provider = provider
    awsLambdaFunction.functionName = 'hello'

    const children = await awsLambdaFunction.define(context)

    expect(children.role.name).toEqual('AwsIamRole')
    expect(children.role.roleName).toEqual(`${awsLambdaFunction.functionName}-execution-role`)
    expect(children.role.service).toEqual('lambda.amazonaws.com')
    expect(children.role.provider).toEqual(provider)
  })
})
