const AWS = require('aws-sdk')
const awsSubnetComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createVpcMock: jest.fn(() => ({
      Vpc: {
        VpcId: 'vpc-abbaabba',
        CidrBlock: '10.0.0.0/16',
        instanceTenancy: 'default'
      }
    })),
    deleteVpcMock: jest.fn(({ VpcId }) => {
      if (VpcId === 'vpc-not-abba') {
        throw new Error(`The vpc ID 'vpc-not-abba' does not exist`)
      } else if (VpcId === 'vpc-error') {
        throw new Error('Something went wrong')
      }
      return {}
    })
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

describe('#aws-subnet', () => {
  it('should have tests', async () => {
    expect(await awsSubnetComponent.deploy()).toEqual({})
  })
})
