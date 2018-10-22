const AWS = require('aws-sdk')
const awsVpcRouteTableComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createRouteTableMock: jest.fn(() => ({
      RouteTable: {
        RouteTableId: 'rtb-abbaabba'
      }
    })),
    deleteRouteTableMock: jest.fn(({ RouteTableId }) => {
      if (RouteTableId === 'rtb-not-abba') {
        const error = new Error()
        error.code = 'InvalidRouteTableID.NotFound'
        throw error
      } else if (RouteTableId === 'rtb-error') {
        throw new Error('Something went wrong')
      }
      return {}
    })
  }

  const EC2 = {
    createRouteTable: (obj) => ({
      promise: () => mocks.createRouteTableMock(obj)
    }),
    deleteRouteTable: (obj) => ({
      promise: () => mocks.deleteRouteTableMock(obj)
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

describe('AWS VPC Route Table Unit Tests', () => {
  it('should create a new route table', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      vpcId: 'vpc-abbaabba'
    }

    const result = await awsVpcRouteTableComponent.deploy(inputs, contextMock)
    expect(result).toEqual({ routeTableId: 'rtb-abbaabba' })
    expect(AWS.mocks.createRouteTableMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRouteTableMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update the route table', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-baababba',
        routeTableId: 'rtb-baababba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      vpcId: 'vpc-abbaabba'
    }

    const result = await awsVpcRouteTableComponent.deploy(inputs, contextMock)
    expect(result).toEqual({ routeTableId: 'rtb-abbaabba' })
    expect(AWS.mocks.createRouteTableMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRouteTableMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should ignore if vpc is not changed', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba',
        routeTableId: 'rtb-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      vpcId: 'vpc-abbaabba'
    }

    const result = await awsVpcRouteTableComponent.deploy(inputs, contextMock)
    expect(result).toEqual({ routeTableId: 'rtb-abbaabba' })
    expect(AWS.mocks.createRouteTableMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteRouteTableMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should remote the route table', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba',
        routeTableId: 'rtb-abbaabba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      vpcId: 'vpc-abbaabba'
    }

    const result = await awsVpcRouteTableComponent.remove(inputs, contextMock)
    expect(result).toEqual({})
    expect(AWS.mocks.createRouteTableMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteRouteTableMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should omit not found error on remove', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba',
        routeTableId: 'rtb-not-abba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      vpcId: 'vpc-abbaabba'
    }

    const result = await awsVpcRouteTableComponent.remove(inputs, contextMock)
    expect(result).toEqual({})
    expect(AWS.mocks.createRouteTableMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteRouteTableMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should throw error on unexpected error', async () => {
    const contextMock = {
      state: {
        vpcId: 'vpc-abbaabba',
        routeTableId: 'rtb-error'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      vpcId: 'vpc-abbaabba'
    }

    let result
    try {
      result = await awsVpcRouteTableComponent.remove(inputs, contextMock)
    } catch (error) {
      expect(error.message).toBe('Something went wrong')
    }

    expect(result).toBeUndefined()
    expect(AWS.mocks.createRouteTableMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteRouteTableMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })
})
