const AWS = require('aws-sdk')
const awsEcsClusterComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createClusterMock: jest.fn(({ clusterName }) => ({
      cluster: {
        clusterArn: `arn:aws:ecs:us-east-1:123456789012:cluster/${clusterName}`,
        clusterName
      }
    })),
    deleteClusterMock: jest.fn().mockResolvedValue({}),
    listTasksMock: jest.fn().mockResolvedValue({
      taskArns: ['arn:aws:ecs:us-east-1:123456789012:task/92ef2e8e-62ae-411f-8f76-cedccaea4fa1']
    }),
    stopTaskMock: jest.fn().mockResolvedValue({})
  }

  const ECS = {
    createCluster: (obj) => ({
      promise: () => mocks.createClusterMock(obj)
    }),
    deleteCluster: (obj) => ({
      promise: () => mocks.deleteClusterMock(obj)
    }),
    listTasks: (obj) => ({
      promise: () => mocks.listTasksMock(obj)
    }),
    stopTask: (obj) => ({
      promise: () => mocks.stopTaskMock(obj)
    })
  }
  return {
    mocks,
    ECS: jest.fn().mockImplementation(() => ECS)
  }
})

afterEach(() => {
  Object.keys(AWS.mocks).forEach((mock) => AWS.mocks[mock].mockClear())
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AWS ECS Cluster Unit Tests', () => {
  it('should create a new cluster', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      clusterName: 'default'
    }

    const { clusterArn } = await awsEcsClusterComponent.deploy(inputs, contextMock)

    expect(clusterArn).toBe('arn:aws:ecs:us-east-1:123456789012:cluster/default')
    expect(AWS.mocks.createClusterMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteClusterMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update the cluster name', async () => {
    const contextMock = {
      state: {
        clusterName: 'default',
        clusterArn: 'arn:aws:ecs:us-east-1:123456789012:cluster/default'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      clusterName: 'my-cluster'
    }

    const { clusterArn } = await awsEcsClusterComponent.deploy(inputs, contextMock)

    expect(clusterArn).toBe('arn:aws:ecs:us-east-1:123456789012:cluster/my-cluster')
    expect(AWS.mocks.createClusterMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteClusterMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should ignore when nothing is changed', async () => {
    const contextMock = {
      state: {
        clusterName: 'default',
        clusterArn: 'arn:aws:ecs:us-east-1:123456789012:cluster/default'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      clusterName: 'default'
    }

    const { clusterArn } = await awsEcsClusterComponent.deploy(inputs, contextMock)

    expect(clusterArn).toBe('arn:aws:ecs:us-east-1:123456789012:cluster/default')
    expect(AWS.mocks.createClusterMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteClusterMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should remove the cluster', async () => {
    const contextMock = {
      state: {
        clusterName: 'default',
        clusterArn: 'arn:aws:ecs:us-east-1:123456789012:cluster/default'
      },
      log: () => {},
      saveState: jest.fn()
    }

    AWS.mocks.listTasksMock.mockImplementationOnce().mockResolvedValueOnce({})

    const inputs = {
      clusterName: 'default'
    }

    await awsEcsClusterComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createClusterMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteClusterMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.listTasksMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.stopTaskMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove the cluster with tasks running', async () => {
    const contextMock = {
      state: {
        clusterName: 'default',
        clusterArn: 'arn:aws:ecs:us-east-1:123456789012:cluster/default'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      clusterName: 'default'
    }

    await awsEcsClusterComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createClusterMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteClusterMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.listTasksMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.stopTaskMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
