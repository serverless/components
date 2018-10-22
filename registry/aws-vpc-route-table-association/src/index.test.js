const AWS = require('aws-sdk')
const awsVpcRouteTableAssociationComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    associateRouteTableMock: jest.fn().mockResolvedValue({
      AssociationId: 'rtbassoc-abbaabba'
    }),
    disassociateRouteTableMock: jest.fn(({ AssociationId }) => {
      if (AssociationId === 'rtbassoc-not-abba') {
        const error = new Error()
        error.code = 'InvalidAssociationID.NotFound'
        throw error
      } else if (AssociationId === 'rtbassoc-error') {
        throw new Error('Something went wrong')
      }
      return {}
    })
  }

  const EC2 = {
    associateRouteTable: (obj) => ({
      promise: () => mocks.associateRouteTableMock(obj)
    }),
    disassociateRouteTable: (obj) => ({
      promise: () => mocks.disassociateRouteTableMock(obj)
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

describe('AWS VPC Route Table Association Unit Tests', () => {
  it('should create a new route table association', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      subnetId: 'subnet-abbaabba',
      routeTableId: 'rtb-abbaabba'
    }

    const result = await awsVpcRouteTableAssociationComponent.deploy(inputs, contextMock)
    expect(result).toEqual({ associationId: 'rtbassoc-abbaabba' })
    expect(AWS.mocks.associateRouteTableMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.disassociateRouteTableMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update the route table association', async () => {
    const contextMock = {
      state: {
        subnetId: 'subnet-baababba',
        routeTableId: 'rtb-baababba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      subnetId: 'subnet-abbaabba',
      routeTableId: 'rtb-abbaabba'
    }

    const result = await awsVpcRouteTableAssociationComponent.deploy(inputs, contextMock)
    expect(result).toEqual({ associationId: 'rtbassoc-abbaabba' })
    expect(AWS.mocks.associateRouteTableMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.disassociateRouteTableMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should ignore deploy if nothing is change', async () => {
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

    const result = await awsVpcRouteTableAssociationComponent.deploy(inputs, contextMock)
    expect(result).toEqual({ associationId: 'rtbassoc-abbaabba' })
    expect(AWS.mocks.associateRouteTableMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.disassociateRouteTableMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should remote the route table', async () => {
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

    const result = await awsVpcRouteTableAssociationComponent.remove(inputs, contextMock)
    expect(result).toEqual({})
    expect(AWS.mocks.associateRouteTableMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.disassociateRouteTableMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should omit not found error on remove', async () => {
    const contextMock = {
      state: {
        subnetId: 'subnet-abbaabba',
        routeTableId: 'rtb-abbaabba',
        associationId: 'rtbassoc-not-abba'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      subnetId: 'subnet-abbaabba',
      routeTableId: 'rtb-abbaabba'
    }

    const result = await awsVpcRouteTableAssociationComponent.remove(inputs, contextMock)
    expect(result).toEqual({})
    expect(AWS.mocks.associateRouteTableMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.disassociateRouteTableMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should throw error on unexpected error', async () => {
    const contextMock = {
      state: {
        subnetId: 'subnet-abbaabba',
        routeTableId: 'rtb-abbaabba',
        associationId: 'rtbassoc-error'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      subnetId: 'subnet-abbaabba',
      routeTableId: 'rtb-abbaabba'
    }

    let result
    try {
      result = await awsVpcRouteTableAssociationComponent.remove(inputs, contextMock)
    } catch (error) {
      expect(error.message).toBe('Something went wrong')
    }

    expect(result).toBeUndefined()
    expect(AWS.mocks.associateRouteTableMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.disassociateRouteTableMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })
})
