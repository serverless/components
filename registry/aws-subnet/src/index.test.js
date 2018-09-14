const AWS = require('aws-sdk')
const awsSubnetComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createSubnetMock: jest.fn(() => ({
      Subnet: {
        SubnetId: 'subnet-abbaabba'
      }
    })),
    deleteSubnetMock: jest.fn(({ VpcId }) => {
      if (VpcId === 'vpc-not-abba') {
        throw new Error(`The subnet ID 'subnet-not-abba' does not exist`)
      } else if (VpcId === 'vpc-error') {
        throw new Error('Something went wrong')
      }
      return {}
    })
  }

  const EC2 = {
    createSubnet: (obj) => ({
      promise: () => mocks.createSubnetMock(obj)
    }),
    deleteSubnet: (obj) => ({
      promise: () => mocks.deleteSubnetMock(obj)
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

describe('AWS Subnet Unit Tests', () => {
  it('should create a new subnet', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      vpcId: 'vpc-abbaabba',
      availabilityZone: 'us-east-1a'
    }

    const { subnetId } = await awsSubnetComponent.deploy(inputs, contextMock)
    expect(subnetId).toBe('subnet-abbaabba')
    expect(AWS.mocks.createSubnetMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteSubnetMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove the subnet', async () => {
    const contextMock = {
      state: { subnetId: 'subnet-abbaabba' },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      vpcId: 'vpc-abbaabba',
      availabilityZone: 'us-east-1a'
    }

    await awsSubnetComponent.remove(inputs, contextMock)
    expect(AWS.mocks.createSubnetMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteSubnetMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update an existing ubnet', async () => {
    const contextMock = {
      state: {
        subnetId: 'subnet-abbaabba',
        vpcId: 'vpc-abbaabba',
        availabilityZone: 'us-east-1a'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      vpcId: 'vpc-abbaabba',
      availabilityZone: 'us-east-1b'
    }

    const { subnetId } = await awsSubnetComponent.deploy(inputs, contextMock)
    expect(subnetId).toBe('subnet-abbaabba')
    expect(AWS.mocks.createSubnetMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteSubnetMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })
})
