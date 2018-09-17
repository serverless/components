const AWS = require('aws-sdk')
const awsEcsClusterComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createEcsClusterMock: jest.fn(({ clusterName }) => ({
      cluster: {
        clusterArn: `arn:aws:ecs:us-east-1:123456789012:cluster/${clusterName}`,
        clusterName
      }
    })),
    deleteEcsClusterMock: jest.fn().mockResolvedValue({})
  }

  const ECS = {
    createCluster: (obj) => ({
      promise: () => mocks.createEcsClusterMock(obj)
    }),
    deleteCluster: (obj) => ({
      promise: () => mocks.deleteEcsClusterMock(obj)
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
    expect(AWS.mocks.createEcsClusterMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteEcsClusterMock).toHaveBeenCalledTimes(0)
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
    expect(AWS.mocks.createEcsClusterMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteEcsClusterMock).toHaveBeenCalledTimes(1)
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
    expect(AWS.mocks.createEcsClusterMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteEcsClusterMock).toHaveBeenCalledTimes(0)
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

    const inputs = {
      clusterName: 'default'
    }

    await awsEcsClusterComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createEcsClusterMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteEcsClusterMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
