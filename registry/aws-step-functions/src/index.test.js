const AWS = require('aws-sdk')
const StepFunctionComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createStateMachineMock: jest
      .fn()
      .mockReturnValue({ name: 'component', stateMachineArn: 'arn:state' }),
    updateStateMachineMock: jest.fn().mockImplementation((params) => {
      if (!params.stateMachineArn) {
        return Promise.reject(new Error('Arn missed'))
      }
      return Promise.resolve()
    }),
    deleteStateMachineMock: jest.fn().mockImplementation((params) => {
      if (params.stateMachineArn === 'arn:bad-arn') {
        return Promise.reject(new Error(`'Invalid ARN format: ${params.stateMachineArn}`))
      }
      return Promise.resolve()
    })
  }

  const StepFunction = {
    createStateMachine: (obj) => ({
      promise: () => mocks.createStateMachineMock(obj)
    }),
    deleteStateMachine: (obj) => ({
      promise: () => mocks.deleteStateMachineMock(obj)
    }),
    updateStateMachine: (obj) => ({
      promise: () => mocks.updateStateMachineMock(obj)
    })
  }
  return {
    mocks,
    StepFunctions: jest.fn().mockImplementation(() => StepFunction)
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('aws-step-function-state-machine tests', () => {
  it('should create step function state machine component with no errors', async () => {
    const StepFunctionContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'component',
      roleArn: 'arn:xyz'
    }

    const outputs = await StepFunctionComponent.deploy(inputs, StepFunctionContextMock)
    expect(AWS.StepFunctions).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createStateMachineMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateStateMachineMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteStateMachineMock).toHaveBeenCalledTimes(0)
    expect(outputs.name).toEqual(inputs.name)
    expect(outputs.stateMachineArn).toEqual('arn:state')
    expect(StepFunctionContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update state machine on second time with no errors', async () => {
    const StepFunctionContextMock = {
      state: { stateMachineArn: 'arn:state', name: 'component' },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'component',
      definition: { x: 1 },
      roleArn: 'arn:role'
    }

    const outputs = await StepFunctionComponent.deploy(inputs, StepFunctionContextMock)

    expect(AWS.StepFunctions).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createStateMachineMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateStateMachineMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateStateMachineMock).toHaveBeenCalledWith({
      stateMachineArn: 'arn:state',
      roleArn: 'arn:role',
      definition: JSON.stringify({ x: 1 }, null, 2)
    })

    expect(AWS.mocks.deleteStateMachineMock).toHaveBeenCalledTimes(0)
    expect(outputs.name).toEqual(inputs.name)
    expect(outputs.stateMachineArn).toEqual('arn:state')
    expect(StepFunctionContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should throw err on updating state machine', async () => {
    const StepFunctionContextMock = {
      state: { name: 'component' },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'component',
      definition: { x: 1 },
      roleArn: 'arn:role'
    }

    try {
      await StepFunctionComponent.deploy(inputs, StepFunctionContextMock)
    } catch (e) {}
    expect(AWS.StepFunctions).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createStateMachineMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateStateMachineMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateStateMachineMock).toHaveBeenCalledWith({
      roleArn: 'arn:role',
      definition: JSON.stringify({ x: 1 }, null, 2)
    })
    expect(AWS.mocks.updateStateMachineMock).toThrowError()
    expect(AWS.mocks.deleteStateMachineMock).toHaveBeenCalledTimes(0)
  })

  it('should remove step function state machine with no errors', async () => {
    const StepFunctionContextMock = {
      state: {
        stateMachineArn: 'arn:state'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'amazing'
    }

    const outputs = await StepFunctionComponent.remove(inputs, StepFunctionContextMock)

    expect(AWS.StepFunctions).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createStateMachineMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateStateMachineMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteStateMachineMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteStateMachineMock).toHaveBeenCalledWith({ stateMachineArn: 'arn:state' })
    expect(StepFunctionContextMock.saveState).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual({ stateMachineArn: null, name: null })
  })

  it('should remove a non-deployed step function state machine with no errors', async () => {
    const StepFunctionContextMock = {
      state: {
        stateMachineArn: 'arn:state'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'amazing'
    }

    const outputs = await StepFunctionComponent.remove(inputs, StepFunctionContextMock)

    expect(AWS.StepFunctions).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createStateMachineMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateStateMachineMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteStateMachineMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteStateMachineMock).toHaveBeenCalledWith({ stateMachineArn: 'arn:state' })
    expect(StepFunctionContextMock.saveState).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual({ stateMachineArn: null, name: null })
  })

  it('should throw error on deleting tep function state machine with bad arn', async () => {
    const StepFunctionContextMock = {
      state: {
        stateMachineArn: 'arn:bad-arn'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'amazing'
    }
    try {
      await StepFunctionComponent.remove(inputs, StepFunctionContextMock)
    } catch (e) {}

    expect(AWS.StepFunctions).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createStateMachineMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateStateMachineMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteStateMachineMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteStateMachineMock).toHaveBeenCalledWith({
      stateMachineArn: 'arn:bad-arn'
    })
    expect(AWS.mocks.deleteStateMachineMock).toThrowError()
  })
})
