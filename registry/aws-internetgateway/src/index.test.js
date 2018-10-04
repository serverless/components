const AWS = require('aws-sdk')
const awsInternetgatewayComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createInternetGatewayMock: jest.fn().mockResolvedValue({
      InternetGateway: {
        InternetGatewayId: 'igw-abbaabba'
      }
    }),
    deleteInternetGatewayMock: jest.fn().mockImplementation((value) => {
      if (value.InternetGatewayId === 'igw-removed') {
        throw new Error("The internetGateway ID 'igw-removed' does not exist")
      } else if (value.InternetGatewayId === 'igw-error') {
        throw new Error('Something went wrong')
      }
      return Promise.resolve({})
    })
  }

  const EC2 = {
    createInternetGateway: (obj) => ({
      promise: () => mocks.createInternetGatewayMock(obj)
    }),
    deleteInternetGateway: (obj) => ({
      promise: () => mocks.deleteInternetGatewayMock(obj)
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
describe('AWS Internet Gateway Unit Tests', () => {
  it('should create an Internet Gateway', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }
    const inputs = {}

    const { internetGatewayId } = await awsInternetgatewayComponent.deploy(inputs, contextMock)

    expect(internetGatewayId).toBe('igw-abbaabba')
    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should create an Internet Gateway with VPC Gateway Attachment', async () => {
    const loadDeployMock = jest.fn().mockReturnValue({
      internetGatewayId: 'igw-abbaabba'
    })
    const loadMock = jest.fn().mockReturnValue({ deploy: loadDeployMock })
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn(),
      load: loadMock
    }
    const inputs = {
      vpcId: 'vpc-abbaabba'
    }

    const { internetGatewayId } = await awsInternetgatewayComponent.deploy(inputs, contextMock)

    expect(internetGatewayId).toBe('igw-abbaabba')
    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should create an Internet Gateway with VPC Gateway Attachment to changed VPC', async () => {
    const loadDeployMock = jest.fn().mockReturnValue({
      internetGatewayId: 'igw-abbaabba'
    })
    const loadRemoveMock = jest.fn().mockReturnValue({})
    const loadMock = jest.fn().mockReturnValue({ deploy: loadDeployMock, remove: loadRemoveMock })
    const contextMock = {
      state: { vpcId: 'vpc-abbabaab' },
      log: () => {},
      saveState: jest.fn(),
      load: loadMock
    }
    const inputs = {
      vpcId: 'vpc-abbaabba'
    }

    const { internetGatewayId } = await awsInternetgatewayComponent.deploy(inputs, contextMock)

    expect(internetGatewayId).toBe('igw-abbaabba')
    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove VPC Gateway Attachment when removed from inputs', async () => {
    const loadRemoveMock = jest.fn().mockReturnValue({})
    const loadMock = jest.fn().mockReturnValue({ remove: loadRemoveMock })
    const contextMock = {
      state: { vpcId: 'vpc-abbaabba', internetGatewayId: 'igw-abbaabba' },
      log: () => {},
      saveState: jest.fn(),
      load: loadMock
    }
    const inputs = {}

    const { internetGatewayId } = await awsInternetgatewayComponent.deploy(inputs, contextMock)
    expect(internetGatewayId).toBe('igw-abbaabba')
    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove the Internet Gateway ', async () => {
    const contextMock = {
      state: {
        internetGatewayId: 'igw-abbaabba',
        vpcId: 'vpc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }
    const inputs = {}

    await awsInternetgatewayComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove the Internet Gateway and VPC Gateway Attachment', async () => {
    const loadRemoveMock = jest.fn().mockReturnValue({})
    const loadMock = jest.fn().mockReturnValue({ remove: loadRemoveMock })
    const contextMock = {
      state: {
        internetGatewayId: 'igw-abbaabba',
        vpcId: 'vpc-abbaabba',
        awsVpcgatewayattachment: true
      },
      log: () => {},
      saveState: jest.fn(),
      load: loadMock
    }
    const inputs = {}

    await awsInternetgatewayComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should ignore if nothing is changes', async () => {
    const contextMock = {
      state: {
        internetGatewayId: 'igw-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }

    const inputs = {
      internetGatewayId: 'igw-abbaabba'
    }

    const { internetGatewayId } = await awsInternetgatewayComponent.deploy(inputs, contextMock)

    expect(internetGatewayId).toBe('igw-abbaabba')
    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should ignore if nothing is changes with VPC Gateway Attachment', async () => {
    const contextMock = {
      state: {
        internetGatewayId: 'igw-abbaabba',
        vpcId: 'vpc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }

    const inputs = {
      internetGatewayId: 'igw-abbaabba',
      vpcId: 'vpc-abbaabba'
    }

    const { internetGatewayId } = await awsInternetgatewayComponent.deploy(inputs, contextMock)

    expect(internetGatewayId).toBe('igw-abbaabba')
    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should handle error if attachment is removed manually', async () => {
    const loadRemoveMock = jest.fn().mockReturnValue({})
    const loadMock = jest.fn().mockReturnValue({ remove: loadRemoveMock })
    const contextMock = {
      state: {
        internetGatewayId: 'igw-removed',
        vpcId: 'vpc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn(),
      load: loadMock
    }
    const inputs = {}

    await awsInternetgatewayComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should throw error while removing', async () => {
    const contextMock = {
      state: {
        internetGatewayId: 'igw-error'
      },
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }
    const inputs = {}

    let response
    try {
      response = await awsInternetgatewayComponent.remove(inputs, contextMock)
    } catch (exception) {
      expect(exception.message).toBe('Something went wrong')
    }

    expect(response).toBeUndefined()
    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should ignore removal if internet gateway id is missing', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn(),
      load: jest.fn()
    }
    const inputs = {}

    await awsInternetgatewayComponent.remove(inputs, contextMock)

    expect(AWS.mocks.createInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteInternetGatewayMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
