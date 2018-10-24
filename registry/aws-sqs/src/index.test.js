const AWS = require('aws-sdk')
const sqsComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createQueueMock: jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/myQueue' })
      ),
    deleteQueueMock: jest.fn().mockImplementation((queueUrl) => {
      if (queueUrl === 'https://sqs.us-east-1.amazonaws.com/123/1234MyQueue') {
        return Promise.reject(new Error('Queu not found'))
      }
      return Promise.resolve({ QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/myQueue' })
    })
  }

  const SQS = {
    createQueue: (obj) => ({
      promise: () => mocks.createQueueMock(obj)
    }),
    deleteQueue: (obj) => ({
      promise: () => mocks.deleteQueueMock(obj)
    })
  }
  return {
    mocks,
    SQS: jest.fn().mockImplementation(() => SQS)
  }
})

afterEach(() => {
  AWS.mocks.createQueueMock.mockClear()
  AWS.mocks.deleteQueueMock.mockClear()
})

describe('aws-sqs unit tests', () => {
  it('should deploy aws-sqs queue without error', async () => {
    const sqsContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      queueName: 'myQueue',
      delaySeconds: '21',
      maximumMessageSize: '1024'
    }

    const outputs = await sqsComponent.deploy(inputs, sqsContextMock)
    expect(AWS.SQS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createQueueMock).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual('https://sqs.us-east-1.amazonaws.com/123/myQueue')
  })

  it('should deploy aws-sqs queue without error', async () => {
    const sqsContextMock = {
      state: {
        queueName: 'myQueueOld',
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/myQueueOld'
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      queueName: 'myQueue'
    }

    const outputs = await sqsComponent.deploy(inputs, sqsContextMock)
    expect(AWS.SQS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteQueueMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createQueueMock).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual('https://sqs.us-east-1.amazonaws.com/123/myQueue')
  })

  it('should deploy aws-sqs queue without error', async () => {
    const sqsContextMock = {
      state: {
        queueName: 'myQueue',
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/myQueue'
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      queueName: 'myQueue',
      delaySeconds: '21',
      maximumMessageSize: '1024'
    }

    const outputs = await sqsComponent.deploy(inputs, sqsContextMock)
    expect(AWS.SQS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteQueueMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createQueueMock).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual('https://sqs.us-east-1.amazonaws.com/123/myQueue')
  })

  it('should remove deployed aws-sqs queue without error', async () => {
    const sqsContextMock = {
      state: {
        queueName: 'myQueueOld',
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/myQueueOld'
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {}

    const outputs = await sqsComponent.deploy(inputs, sqsContextMock)
    expect(AWS.SQS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteQueueMock).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual(null)
  })

  it('should remove aws-sqs queue without error', async () => {
    const sqsContextMock = {
      state: {
        queueName: 'myQueueOld',
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/myQueueOld'
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {}

    const outputs = await sqsComponent.remove(inputs, sqsContextMock)

    expect(AWS.SQS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteQueueMock).toHaveBeenCalledTimes(1)
    expect(outputs.queueUrl).toEqual(null)
  })
})
