const AWS = require('aws-sdk')
const awsSecurityGroupComponent = require('./index')
const { sleep } = require('@serverless/utils')

jest.mock('@serverless/utils')

sleep.mockImplementation(() => Promise.resolve())

jest.mock('aws-sdk', () => {
  const mocks = {
    createSecurityGroupMock: jest.fn().mockResolvedValue({
      GroupId: 'sg-abbaabba'
    }),
    deleteSecurityGroupMock: jest.fn(({ GroupId }) => {
      if (GroupId === 'sg-some-error') {
        const error = new Error('Some.Message')
        error.code = 'Some.Code'
        return Promise.reject(error)
      }
      return Promise.resolve({})
    })
  }

  const EC2 = {
    createSecurityGroup: (obj) => ({
      promise: () => mocks.createSecurityGroupMock(obj)
    }),
    deleteSecurityGroup: (obj) => ({
      promise: () => mocks.deleteSecurityGroupMock(obj)
    })
  }
  return {
    mocks,
    EC2: jest.fn().mockImplementation(() => EC2)
  }
})

afterEach(() => {
  Object.keys(AWS.mocks).forEach((mock) => AWS.mocks[mock].mockClear())
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('Unit tests for AWS Security Group', () => {
  it('should a new security group', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    const inputs = {
      vpcId: 'vpc-abbaabba'
    }
    const response = await awsSecurityGroupComponent.deploy(inputs, contextMock)
    expect(response).toEqual({ groupId: 'sg-abbaabba', groupName: 'default-my-instance' })
    expect(AWS.mocks.createSecurityGroupMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(0)
  })

  it('should ignore if nothing is changed', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba',
        groupName: 'mySecurityGroup',
        groupId: 'sg-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    const inputs = {
      vpcId: 'vpc-abbaabba',
      groupName: 'mySecurityGroup'
    }
    const response = await awsSecurityGroupComponent.deploy(inputs, contextMock)
    expect(response).toEqual({ groupId: 'sg-abbaabba', groupName: 'mySecurityGroup' })
    expect(AWS.mocks.createSecurityGroupMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(0)
  })

  it('should ignore deletion on change if previous is already deleted', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba',
        groupName: 'mySecurityGroup',
        groupId: 'sg-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    AWS.mocks.deleteSecurityGroupMock
      .mockImplementationOnce()
      .mockRejectedValueOnce({ code: 'InvalidGroup.NotFound' })

    const inputs = {
      vpcId: 'vpc-abbaabba',
      groupName: 'not-same'
    }
    const response = await awsSecurityGroupComponent.deploy(inputs, contextMock)
    expect(response).toEqual({ groupId: 'sg-abbaabba', groupName: 'not-same' })
    expect(AWS.mocks.createSecurityGroupMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(1)
  })

  it('should delete existing security group on change', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-not-found',
        groupName: 'mySecurityGroup',
        groupId: 'sg-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    AWS.mocks.deleteSecurityGroupMock.mockImplementationOnce().mockRejectedValueOnce({})

    const inputs = {
      vpcId: 'vpc-abbaabba',
      groupName: 'mySecurityGroup'
    }
    const response = await awsSecurityGroupComponent.deploy(inputs, contextMock)
    expect(response).toEqual({ groupId: 'sg-abbaabba', groupName: 'mySecurityGroup' })
    expect(AWS.mocks.createSecurityGroupMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(1)
    AWS.mocks.deleteSecurityGroupMock.mockReset()
  })

  it('should retry to remove existing security group', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-not-found',
        groupName: 'mySecurityGroup',
        groupId: 'sg-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    let counter = 0
    AWS.mocks.deleteSecurityGroupMock.mockImplementation(() => {
      counter++
      if (counter === 10) {
        return Promise.resolve({})
      }
      return Promise.reject({ code: 'Some.Code' })
    })

    const inputs = {
      vpcId: 'vpc-abbaabba',
      groupName: 'mySecurityGroup'
    }

    const response = await awsSecurityGroupComponent.deploy(inputs, contextMock)
    await new Promise((resolve) => process.nextTick(() => resolve()))

    expect(response).toEqual({ groupId: 'sg-abbaabba', groupName: 'mySecurityGroup' })
    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(10)
    expect(AWS.mocks.createSecurityGroupMock).toHaveBeenCalledTimes(1)
    AWS.mocks.deleteSecurityGroupMock.mockReset()
  })

  it('should try to remove security group 21 times', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-not-found',
        groupName: 'mySecurityGroup',
        groupId: 'sg-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    AWS.mocks.deleteSecurityGroupMock.mockImplementation(() =>
      Promise.reject({ code: 'Some.Code' })
    )

    const inputs = {
      vpcId: 'vpc-abbaabba',
      groupName: 'mySecurityGroup'
    }

    const response = await awsSecurityGroupComponent.deploy(inputs, contextMock)

    await new Promise((resolve) => process.nextTick(() => resolve()))

    expect(response).toEqual({ groupId: 'sg-abbaabba', groupName: 'mySecurityGroup' })
    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(21)
    expect(AWS.mocks.createSecurityGroupMock).toHaveBeenCalledTimes(1)
    AWS.mocks.deleteSecurityGroupMock.mockReset()
  })

  it('should deploy a new security group if inputs changes', async () => {
    const contextMock = {
      state: {
        groupName: 'other',
        vpcId: 'vpc-other',
        description: 'other'
      },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    const inputs = {
      vpcId: 'vpc-abbaabba',
      groupName: 'mySecurityGroup',
      description: 'mySecurityGroup'
    }
    const response = await awsSecurityGroupComponent.deploy(inputs, contextMock)
    expect(response).toEqual({ groupId: 'sg-abbaabba', groupName: 'mySecurityGroup' })
    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createSecurityGroupMock).toHaveBeenCalledTimes(1)
  })

  it('should remove the security group', async () => {
    const contextMock = {
      state: { vpcId: 'vpc-abbaabba', groupId: 'sg-abbaabba', groupName: 'mySecurityGroup' },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    const inputs = {
      vpcId: 'vpc-abbaabba',
      groupName: 'mySecurityGroup'
    }

    await awsSecurityGroupComponent.remove(inputs, contextMock)

    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(1)
  })

  it('should ignore if security group is already removed', async () => {
    const contextMock = {
      state: { vpcId: 'vpc-abbaabba', groupId: 'sg-not-found', groupName: 'mySecurityGroup' },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    AWS.mocks.deleteSecurityGroupMock
      .mockImplementation()
      .mockRejectedValueOnce({ code: 'InvalidGroup.NotFound' })

    const inputs = {
      vpcId: 'vpc-abbaabba',
      groupName: 'mySecurityGroup'
    }

    await awsSecurityGroupComponent.remove(inputs, contextMock)

    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(1)
  })

  it('should throw error if unexpected error occures', async () => {
    const contextMock = {
      state: { vpcId: 'vpc-some-error', groupId: 'sg-some-error', groupName: 'mySecurityGroup' },
      log: () => {},
      saveState: jest.fn(),
      instanceId: 'my-instance'
    }

    const inputs = {}
    AWS.mocks.deleteSecurityGroupMock.mockImplementation(() => {
      return Promise.reject({ code: 'Some.Code' })
    })

    let response

    try {
      response = await awsSecurityGroupComponent.remove(inputs, contextMock)
    } catch (exception) {
      expect(exception).toEqual({ code: 'Some.Code' })
    }

    expect(response).toBeUndefined()
    expect(AWS.mocks.deleteSecurityGroupMock).toHaveBeenCalledTimes(21)
  })
})
