const AWS = require('aws-sdk')
const lambdaComponent = require('./index')

jest.mock('./pack', () => jest.fn())

jest.mock('aws-sdk', () => {
  const mocks = {
    createFunctionMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:xyz' }),
    updateFunctionConfigurationMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:xyz' }),
    updateFunctionCodeMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:xyz' }),
    deleteFunctionMock: jest.fn().mockImplementation((params) => {
      if (params.FunctionName === 'some-already-removed-function') {
        return Promise.reject(new Error('Function not found '))
      }
      return Promise.resolve()
    })
  }

  const Lambda = {
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
  return {
    mocks,
    Lambda: jest.fn().mockImplementation(() => Lambda)
  }
})

afterEach(() => {
  AWS.mocks.createFunctionMock.mockClear()
  AWS.mocks.updateFunctionConfigurationMock.mockClear()
  AWS.mocks.updateFunctionCodeMock.mockClear()
  AWS.mocks.deleteFunctionMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('aws-lambda tests', () => {
  it('should deploy lambda component with no errors', async () => {
    const lambdaContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }

    const inputs = {
      name: 'some-lambda-name',
      memory: 512,
      timeout: 10,
      handler: 'handle.code',
      role: {
        arn: 'abc:xyz'
      }
    }

    const outputs = await lambdaComponent.deploy(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createFunctionMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createFunctionMock).toBeCalledWith(
      expect.objectContaining({
        Code: { ZipFile: undefined },
        Description: undefined,
        Environment: { Variables: undefined },
        FunctionName: 'some-lambda-name',
        Handler: 'handle.code',
        MemorySize: 512,
        Publish: true,
        Role: 'abc:xyz',
        Timeout: 10
      })
    )
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.roleArn).toEqual('abc:xyz')
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should deploy lambda component using custom runtime with no errors', async () => {
    const lambdaContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }

    const inputs = {
      name: 'some-lambda-name',
      memory: 512,
      timeout: 10,
      runtime: 'nodejs6.10',
      handler: 'handle.code',
      role: {
        arn: 'abc:xyz'
      }
    }

    const outputs = await lambdaComponent.deploy(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createFunctionMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createFunctionMock).toBeCalledWith(
      expect.objectContaining({
        Code: { ZipFile: undefined },
        Description: undefined,
        Environment: { Variables: undefined },
        FunctionName: 'some-lambda-name',
        Handler: 'handle.code',
        MemorySize: 512,
        Publish: true,
        Role: 'abc:xyz',
        Runtime: 'nodejs6.10',
        Timeout: 10
      })
    )
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.roleArn).toEqual('abc:xyz')
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update lambda code and config with no errors', async () => {
    const lambdaContextMock = {
      state: { name: 'some-lambda-name' },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }

    const inputs = {
      name: 'some-lambda-name',
      memory: 512,
      timeout: 10,
      handler: 'handle.code',
      role: {
        arn: 'abc:xyz'
      }
    }

    const outputs = await lambdaComponent.deploy(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateFunctionConfigurationMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateFunctionConfigurationMock).toBeCalledWith(
      expect.objectContaining({
        Description: undefined,
        Environment: { Variables: undefined },
        FunctionName: 'some-lambda-name',
        Handler: 'handle.code',
        MemorySize: 512,
        Role: 'abc:xyz',
        Runtime: undefined,
        Timeout: 10
      })
    )
    expect(AWS.mocks.updateFunctionCodeMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.roleArn).toEqual('abc:xyz')
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update lambda code with custom runtime and config with no errors', async () => {
    const lambdaContextMock = {
      state: { name: 'some-lambda-name' },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }

    const inputs = {
      name: 'some-lambda-name',
      memory: 512,
      timeout: 10,
      runtime: 'nodejs6.10',
      handler: 'handle.code',
      role: {
        arn: 'abc:xyz'
      }
    }

    const outputs = await lambdaComponent.deploy(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateFunctionConfigurationMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateFunctionConfigurationMock).toBeCalledWith(
      expect.objectContaining({
        Description: undefined,
        Environment: { Variables: undefined },
        FunctionName: 'some-lambda-name',
        Handler: 'handle.code',
        MemorySize: 512,
        Role: 'abc:xyz',
        Runtime: 'nodejs6.10',
        Timeout: 10
      })
    )
    expect(AWS.mocks.updateFunctionCodeMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.roleArn).toEqual('abc:xyz')
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update lambda name with no errors', async () => {
    const lambdaContextMock = {
      state: { name: 'some-lambda-name' },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }

    const inputs = {
      name: 'some-new-lambda-name',
      memory: 512,
      timeout: 10,
      handler: 'handle.code',
      role: {
        arn: 'abc:xyz'
      }
    }

    const outputs = await lambdaComponent.deploy(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createFunctionMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteFunctionMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.roleArn).toEqual('abc:xyz')
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createFunctionMock.mock.calls[0][0].FunctionName).toEqual(inputs.name)
    const deleteFunctionName = AWS.mocks.deleteFunctionMock.mock.calls[0][0].FunctionName
    expect(deleteFunctionName).toEqual(lambdaContextMock.state.name)
  })

  it('should remove lambda after deployment with no errors', async () => {
    const lambdaContextMock = {
      state: { name: 'some-lambda-name' },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }

    const inputs = {
      name: 'some-lambda-name',
      memory: 512,
      timeout: 10,
      handler: 'handle.code',
      role: {
        arn: 'abc:xyz'
      }
    }

    const outputs = await lambdaComponent.remove(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteFunctionMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(null)
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove a non-deployed lambda component with no errors', async () => {
    const lambdaContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }

    const inputs = {
      name: 'some-lambda-name',
      memory: 512,
      timeout: 10,
      handler: 'handle.code',
      role: {
        arn: 'abc:xyz'
      }
    }

    const outputs = await lambdaComponent.remove(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteFunctionMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toEqual(null)
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should deploy iam component when no role is provided', async () => {
    const loadDeployMock = jest.fn().mockReturnValue({ arn: 'abc:xyz' })
    const loadMock = jest.fn().mockReturnValue({ deploy: loadDeployMock })
    const lambdaContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      load: loadMock
    }

    const inputs = {
      name: 'some-lambda-name',
      memory: 512,
      timeout: 10,
      handler: 'handle.code'
    }

    const outputs = await lambdaComponent.deploy(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(loadMock).toBeCalledWith('aws-iam-role', 'defaultRole', {
      name: `${inputs.name}-execution-role`,
      service: 'lambda.amazonaws.com'
    })
    expect(loadDeployMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createFunctionMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.roleArn).toEqual('abc:xyz')
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove iam component when no role is provided', async () => {
    const loadRemoveMock = jest.fn().mockReturnValue({ arn: null })
    const loadMock = jest.fn().mockReturnValue({ remove: loadRemoveMock })

    const inputs = {
      name: 'some-lambda-name',
      memory: 512,
      timeout: 10,
      handler: 'handle.code'
    }

    const lambdaContextMock = {
      state: {
        name: 'some-lambda-name',
        defaultRole: {
          name: `${inputs.name}-execution-role`,
          service: 'lambda.amazonaws.com'
        }
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      load: loadMock
    }

    const outputs = await lambdaComponent.remove(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(loadMock).toBeCalledWith('aws-iam-role', 'defaultRole', {
      name: `${inputs.name}-execution-role`,
      service: 'lambda.amazonaws.com'
    })
    expect(loadRemoveMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteFunctionMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(null)
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update state when removing an already removed function component', async () => {
    const inputs = {
      name: 'some-already-removed-function',
      memory: 512,
      timeout: 10,
      handler: 'handler.code'
    }

    const lambdaContextMock = {
      state: {
        name: 'some-lambda-name'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const outputs = await lambdaComponent.remove(inputs, lambdaContextMock)

    expect(AWS.Lambda).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteFunctionMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(null)
    expect(lambdaContextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
