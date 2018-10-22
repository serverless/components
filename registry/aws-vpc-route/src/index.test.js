const AWS = require('aws-sdk')
const awsVpcRouteComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createRouteMock: jest.fn().mockResolvedValue({}),
    deleteRouteMock: jest.fn(({ DestinationCidrBlock }) => {
      if (DestinationCidrBlock === '1.0.0.0/0') {
        const error = new Error()
        error.code = 'InvalidRoute.NotFound'
        throw error
      } else if (DestinationCidrBlock === '2.0.0.0/0') {
        throw new Error('Something went wrong')
      }
      return {}
    })
  }

  const EC2 = {
    createRoute: (obj) => ({
      promise: () => mocks.createRouteMock(obj)
    }),
    deleteRoute: (obj) => ({
      promise: () => mocks.deleteRouteMock(obj)
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

describe('AWS VPC Route Unit Tests', () => {
  it('should create a new route', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: 'igw-abbaabba',
      routeTableId: 'irtb-abbaabba'
    }

    const result = await awsVpcRouteComponent.deploy(inputs, contextMock)
    expect(result).toEqual({})
    expect(AWS.mocks.createRouteMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRouteMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update the route', async () => {
    const contextMock = {
      state: {
        destinationCidrBlock: '10.0.0.0/8',
        gatewayId: 'igw-abbaabba',
        routeTableId: 'irtb-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: 'igw-abbaabba',
      routeTableId: 'irtb-abbaabba'
    }

    const result = await awsVpcRouteComponent.deploy(inputs, contextMock)
    expect(result).toEqual({})
    expect(AWS.mocks.createRouteMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRouteMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should ignore deploy if nothing is change', async () => {
    const contextMock = {
      state: {
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: 'igw-abbaabba',
        routeTableId: 'irtb-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: 'igw-abbaabba',
      routeTableId: 'irtb-abbaabba'
    }

    const result = await awsVpcRouteComponent.deploy(inputs, contextMock)
    expect(result).toEqual({})
    expect(AWS.mocks.createRouteMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteRouteMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should remote the route', async () => {
    const contextMock = {
      state: {
        subnetId: 'subnet-abbaabba',
        routeTableId: 'rtb-abbaabba',
        associationId: 'rtbassoc-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      subnetId: 'subnet-abbaabba',
      routeTableId: 'rtb-abbaabba'
    }

    const result = await awsVpcRouteComponent.remove(inputs, contextMock)
    expect(result).toEqual({})
    expect(AWS.mocks.createRouteMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteRouteMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should omit not found error on remove', async () => {
    const contextMock = {
      state: {
        destinationCidrBlock: '1.0.0.0/0',
        gatewayId: 'igw-abbaabba',
        routeTableId: 'irtb-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: 'igw-abbaabba',
      routeTableId: 'irtb-abbaabba'
    }

    const result = await awsVpcRouteComponent.remove(inputs, contextMock)
    expect(result).toEqual({})
    expect(AWS.mocks.createRouteMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteRouteMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should throw error on unexpected error', async () => {
    const contextMock = {
      state: {
        destinationCidrBlock: '2.0.0.0/0',
        gatewayId: 'igw-abbaabba',
        routeTableId: 'irtb-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: 'igw-abbaabba',
      routeTableId: 'irtb-abbaabba'
    }

    let result
    try {
      result = await awsVpcRouteComponent.remove(inputs, contextMock)
    } catch (error) {
      expect(error.message).toBe('Something went wrong')
    }

    expect(result).toBeUndefined()
    expect(AWS.mocks.createRouteMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteRouteMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })
})
