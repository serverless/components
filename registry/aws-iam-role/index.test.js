const iamComponent = require('./index')

const IAM = function () {
  return {
    attachRolePolicy: () => ({
      promise: jest.fn()
    }),
    detachRolePolicy: () => ({
      promise: jest.fn()
    }),
    createRole: () => ({
      promise: jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } })
    }),
    deleteRole: () => ({
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

  it('should deploy iam component with no errors', async () => {
    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }

    const outputs = await iamComponent.deploy(inputs, iamContextMock)
    expect(outputs.name).toEqual(inputs.name)
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.service).toEqual(inputs.service)
    // todo check methods are called
  })

  it('should deploy iam component a second time with no errors', async () => {
    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }
    iamContextMock.state = {
      ...inputs,
      arn: 'abc:xyz'
    }
    const outputs = await iamComponent.deploy(inputs, iamContextMock)
    expect(outputs.name).toEqual(inputs.name)
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.service).toEqual(inputs.service)
    // todo check methods are called
  })


  it('should remove a non-deployed component with no errors', async () => {
    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }
    const outputs = await iamComponent.remove(inputs, iamContextMock)
    expect(outputs).toEqual({})
    // todo check methods are called
  })
})

