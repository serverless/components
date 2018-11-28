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
  AWS.mocks.createStateMachineMock.mockClear()
  AWS.mocks.updateStateMachineMock.mockClear()
  AWS.mocks.deleteStateMachineMock.mockClear()
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

//
// it('should remove the s3 component after a deployment with no errors', async () => {
//   const s3ContextMock = {
//     state: { name: 'some-bucket-name' },
//     archive: {},
//     log: () => {},
//     saveState: jest.fn()
//   }
//
//   const inputs = {
//     name: 'some-bucket-name'
//   }
//
//   const outputs = await s3Component.remove(inputs, s3ContextMock)
//
//   expect(AWS.S3).toHaveBeenCalledTimes(1)
//   expect(AWS.mocks.deleteBucketMock).toHaveBeenCalledTimes(1)
//   expect(AWS.mocks.listObjectsV2Mock).toHaveBeenCalledTimes(1)
//   expect(AWS.mocks.deleteObjectsMock).toHaveBeenCalledTimes(1)
//   expect(s3ContextMock.saveState).toHaveBeenCalledTimes(1)
//   expect(outputs).toEqual({ name: null })
// })
//
// it('should update the bucket name when input name is changed', async () => {
//   const s3ContextMock = {
//     state: { name: 'old-bucket-name' },
//     archive: {},
//     log: () => {},
//     saveState: jest.fn()
//   }
//
//   const inputs = {
//     name: 'new-bucket-name'
//   }
//
//   const outputs = await s3Component.deploy(inputs, s3ContextMock)
//
//   expect(AWS.S3).toHaveBeenCalledTimes(1)
//   expect(AWS.mocks.createBucketMock).toHaveBeenCalledTimes(1)
//   expect(AWS.mocks.deleteBucketMock).toHaveBeenCalledTimes(1)
//   expect(AWS.mocks.listObjectsV2Mock).toHaveBeenCalledTimes(1)
//   expect(AWS.mocks.deleteObjectsMock).toHaveBeenCalledTimes(1)
//   expect(s3ContextMock.saveState).toHaveBeenCalledTimes(1)
//   expect(outputs).toEqual({ name: inputs.name })
//
//   expect(AWS.mocks.createBucketMock.mock.calls[0][0]).toEqual({
//     Bucket: inputs.name
//   })
//   expect(AWS.mocks.deleteBucketMock.mock.calls[0][0]).toEqual({
//     Bucket: s3ContextMock.state.name
//   })
// })
//
// it('should update state when removing an already removed s3 component', async () => {
//   const inputs = {
//     name: 'some-already-removed-bucket'
//   }
//   const s3ContextMock = {
//     state: inputs,
//     archive: {},
//     log: () => {},
//     saveState: jest.fn()
//   }
//
//   const outputs = await s3Component.remove(inputs, s3ContextMock)
//
//   expect(AWS.S3).toHaveBeenCalledTimes(1)
//   expect(AWS.mocks.listObjectsV2Mock).toHaveBeenCalledTimes(1)
//   expect(s3ContextMock.saveState).toBeCalledWith({})
//   expect(outputs).toEqual({ name: null })
// })
