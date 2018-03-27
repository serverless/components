const proxyquire =  require('proxyquire').noPreserveCache()
const iamComponent = require('./index')

const IAM = function () {
  return {
    attachRolePolicy: () => ({
      promise: jest.fn()
    }),
    createRole: () => ({
      promise: jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } })
    })
  }
}

const iamContextMock = {
  state: {},
  log: () => {},
  saveState: () => {},
  provider: {
    AWS: { IAM }
  }

}

describe('aws-iam-role unit tests', () => {
  jest.setTimeout(20000)

  it('should deploy iam component', async () => {
    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }
    const outputs = await iamComponent.deploy(inputs, iamContextMock)
    console.log(outputs)
    // expect(outputs.arn).toEqual('abc:xyz')
    // expect(outputs.service).toEqual()
  })
})

