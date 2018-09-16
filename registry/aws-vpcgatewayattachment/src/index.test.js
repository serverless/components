const AWS = require('aws-sdk')
const awsVpcgatewayattachmentComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    attachInternetGatewayMock: jest.fn().mockResolvedValue({}),
    detachInternetGatewayMock: jest.fn().mockImplementation((value) => {
      if (value.InternetGatewayId === 'igw-removed') {
        throw new Error("The internetGateway ID 'igw-removed' does not exist")
      } else if (value.InternetGatewayId === 'igw-error') {
        throw new Error('Something went wrong')
      }
      return Promise.resolve({})
    })
  }

  const EC2 = {
    attachInternetGateway: (obj) => ({
      promise: () => mocks.attachInternetGatewayMock(obj)
    }),
    detachInternetGateway: (obj) => ({
      promise: () => mocks.detachInternetGatewayMock(obj)
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
describe('#aws-vpcgatewayattachment', () => {
  it('should create a VPC gateway attachment', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }
    const inputs = {
      internetGatewayId: 'igw-abbaabba',
      vpcId: 'vpc-abbaabba'
    }
    const { internetGatewayId } = await awsVpcgatewayattachmentComponent.deploy(inputs, contextMock)

    expect(internetGatewayId).toBe('igw-abbaabba')
    expect(AWS.mocks.attachInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.detachInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove the VPC gateway attachment', async () => {
    const contextMock = {
      state: {
        internetGatewayId: 'igw-abbaabba',
        vpcId: 'vpc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }
    const inputs = {}

    await awsVpcgatewayattachmentComponent.remove(inputs, contextMock)

    expect(AWS.mocks.attachInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.detachInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should ignore if nothing is changes', async () => {
    const contextMock = {
      state: {
        internetGatewayId: 'igw-abbaabba',
        vpcId: 'vpc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }
    const inputs = {
      internetGatewayId: 'igw-abbaabba',
      vpcId: 'vpc-abbaabba'
    }
    const { internetGatewayId } = await awsVpcgatewayattachmentComponent.deploy(inputs, contextMock)

    expect(internetGatewayId).toBe('igw-abbaabba')
    expect(AWS.mocks.attachInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.detachInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should not try to detach if parameters are not set', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }
    const inputs = {}

    await awsVpcgatewayattachmentComponent.remove(inputs, contextMock)

    expect(AWS.mocks.attachInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.detachInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should handle error if attachment is removed manually', async () => {
    const contextMock = {
      state: {
        internetGatewayId: 'igw-removed',
        vpcId: 'vpc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }
    const inputs = {}

    await awsVpcgatewayattachmentComponent.remove(inputs, contextMock)

    expect(AWS.mocks.attachInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.detachInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should throw error while removing', async () => {
    const contextMock = {
      state: {
        internetGatewayId: 'igw-error',
        vpcId: 'vpc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }
    const inputs = {}

    let response
    try {
      response = await awsVpcgatewayattachmentComponent.remove(inputs, contextMock)
    } catch (exception) {
      expect(exception.message).toBe('Something went wrong')
    }

    expect(response).toBeUndefined()
    expect(AWS.mocks.attachInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.detachInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })
})
