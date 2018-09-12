const AWS = require('aws-sdk')
const awsVpcComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createVpcMock: jest.fn(),
    createDefaultVpcMock: jest.fn(),
    deleteVpcMock: jest.fn()
  }

  const EC2 = {
    createVpc: (obj) => ({
      promise: () => mocks.createVpcMock(obj)
    }),
    createDefaultVpc: (obj) => ({
      promise: () => mocks.createDefaultVpcMock(obj)
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

describe('#${name}', () => {
  it('should have tests', async () => {
    const { vpcId } = await awsVpcComponent.deploy()
    expect(vpcId).toBe(undefined)
  })
})
