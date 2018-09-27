const AWS = require('aws-sdk')
const awsSecurityGroupComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createSecurityGroupMock: jest.fn(() => ({
      GroupId: 'sg-abbaabba'
    })),
    deleteSecurityGroupMock: jest.fn(({ VpcId }) => {
      if (VpcId === 'vpc-not-abba') {
        throw new Error(`The vpc ID 'vpc-not-abba' does not exist`)
      } else if (VpcId === 'vpc-error') {
        throw new Error('Something went wrong')
      }
      return {}
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

describe('#aws-security-group', () => {
  it('should have tests', async () => {
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
  })

  it('should have tests', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba'
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
  })

  it('should have tests', async () => {
    const contextMock = {
      state: { groupId: 'sg-abbaabba', groupName: 'mySecurityGroup' },
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
})
