const AWS = require('aws-sdk')
const awsVpcComponent = require('./index')
const { sleep } = require('@serverless/utils')

jest.mock('@serverless/utils')

jest.mock('aws-sdk', () => {
  const mocks = {
    createVpcMock: jest.fn().mockReturnValue({
      Vpc: {
        VpcId: 'vpc-abbaabba',
        CidrBlock: '10.0.0.0/16',
        instanceTenancy: 'default'
      }
    }),
    deleteVpcMock: jest.fn(({ VpcId }) => {
      if (VpcId === 'vpc-not-abba') {
        throw new Error(`The vpc ID 'vpc-not-abba' does not exist`)
      } else if (VpcId === 'vpc-error') {
        throw new Error('Something went wrong')
      }
      return {}
    }),
    describeSubnetsMock: jest.fn().mockImplementation((value) => {
      if (value.Filters[0].Values[0] === 'vpc-error-describe') {
        return Promise.reject('Something went wrong')
      }
      return Promise.resolve({ Subnets: [] })
    }),
    describeInternetGatewaysMock: jest.fn().mockImplementation((value) => {
      if (value.Filters[0].Values[0] === 'vpc-error-describe') {
        return Promise.reject('Something went wrong')
      }
      return Promise.resolve({ InternetGateways: [] })
    })
  }

  const EC2 = {
    createVpc: (obj) => ({
      promise: () => mocks.createVpcMock(obj)
    }),
    deleteVpc: (obj) => ({
      promise: () => mocks.deleteVpcMock(obj)
    }),
    describeSubnets: (obj) => ({
      promise: () => mocks.describeSubnetsMock(obj)
    }),
    describeInternetGateways: (obj) => ({
      promise: () => mocks.describeInternetGatewaysMock(obj)
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
  sleep.restoreAllMocks()
})

describe('AWS VPC Unit Tests', () => {
  it('should create a new VPC', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    // default input values
    const inputs = {
      cidrBlock: '10.0.0.0/16',
      amazonProvidedIpv6CidrBlock: false,
      instanceTenancy: 'default'
    }

    const { vpcId } = await awsVpcComponent.deploy(inputs, contextMock)

    expect(vpcId).toBe('vpc-abbaabba')
    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove an existing VPC', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-subnets'
      },
      log: () => {},
      saveState: jest.fn()
    }

    AWS.mocks.describeSubnetsMock.mockImplementationOnce().mockResolvedValueOnce({
      Subnets: [
        {
          SubnetId: 'subnet-123'
        }
      ]
    })

    AWS.mocks.describeInternetGatewaysMock.mockImplementationOnce().mockResolvedValueOnce({
      InternetGateways: [
        {
          InternetGatewayId: 'igw-123'
        }
      ]
    })

    const inputs = {}

    await awsVpcComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.describeSubnetsMock).toHaveBeenCalledTimes(2)
    expect(AWS.mocks.describeInternetGatewaysMock).toHaveBeenCalledTimes(2)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove an existing VPC when dependencies fails', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-error-describe'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    await awsVpcComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.describeSubnetsMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.describeInternetGatewaysMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)

    AWS.mocks.describeInternetGatewaysMock.mockClear()
  })

  it("should not error if vpc doesn't exists when removing", async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-not-abba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    await awsVpcComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.describeSubnetsMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should throw an error', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-error'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    let response
    try {
      response = await awsVpcComponent.remove(inputs, contextMock)
    } catch (exception) {
      expect(exception.message).toBe('Something went wrong')
    }
    expect(response).toBeUndefined()
    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.describeSubnetsMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should update the VPC with a new CIDR', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba',
        cidrBlock: '10.0.0.0/20'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    const { vpcId } = await awsVpcComponent.deploy(inputs, contextMock)

    // wait for remove
    await new Promise((resolve) => process.nextTick(() => resolve()))

    expect(vpcId).toBe('vpc-abbaabba')
    expect(contextMock.state.cidrBlock).toBe('10.0.0.0/20')
    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.describeSubnetsMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should ignore when nothing is changed', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba',
        cidrBlock: '10.0.0.0/20',
        amazonProvidedIpv6CidrBlock: true,
        instanceTenancy: 'default'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      cidrBlock: '10.0.0.0/20',
      amazonProvidedIpv6CidrBlock: true,
      instanceTenancy: 'default'
    }

    const { vpcId } = await awsVpcComponent.deploy(inputs, contextMock)
    expect(vpcId).toBe('vpc-abbaabba')
    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
