const AWS = require('aws-sdk')
const awsVpcComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createVpcMock: jest.fn(() => ({
      Vpc: {
        VpcId: 'vpc-abbaabba',
        CidrBlock: '10.0.0.0/16',
        instanceTenancy: 'default'
      }
    })),
    deleteVpcMock: jest.fn()
  }

  const EC2 = {
    createVpc: (obj) => ({
      promise: () => mocks.createVpcMock(obj)
    }),
    deleteVpc: (obj) => ({
      promise: () => mocks.deleteVpcMock(obj)
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

describe('AWS VPC Unit Tests', () => {
  it('should create a new VPC', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    const { vpcId } = await awsVpcComponent.deploy(inputs, contextMock)

    expect(vpcId).toBe('vpc-abbaabba')
    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove an existing VPC', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    await awsVpcComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
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

    expect(vpcId).toBe('vpc-abbaabba')
    expect(contextMock.state.cidrBlock).toBe('10.0.0.0/20')
    expect(AWS.mocks.createVpcMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteVpcMock).toHaveBeenCalledTimes(1)
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
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })
})
