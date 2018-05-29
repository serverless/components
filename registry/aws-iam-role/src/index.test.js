const BbPromise = require('bluebird')
const AWS = require('aws-sdk')
const iamComponent = require('./index')

jest.mock('bluebird', () => ({
  delay: jest.fn(() => Promise.resolve())
}))

jest.mock('aws-sdk', () => {
  const mocks = {
    createRoleMock: jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } }),
    deleteRoleMock: jest.fn().mockImplementation((params) => {
      if (params.RoleName === 'some-already-removed-role') {
        return Promise.reject(new Error('Role not found'))
      }
      return Promise.resolve({ Role: { Arn: null } })
    }),
    attachRolePolicyMock: jest.fn(),
    detachRolePolicyMock: jest.fn()
  }

  const IAM = {
    createRole: (obj) => ({
      promise: () => mocks.createRoleMock(obj)
    }),
    deleteRole: (obj) => ({
      promise: () => mocks.deleteRoleMock(obj)
    }),
    attachRolePolicy: (obj) => ({
      promise: () => mocks.attachRolePolicyMock(obj)
    }),
    detachRolePolicy: (obj) => ({
      promise: () => mocks.detachRolePolicyMock(obj)
    })
  }
  return {
    mocks,
    IAM: jest.fn().mockImplementation(() => IAM)
  }
})

afterEach(() => {
  AWS.mocks.createRoleMock.mockClear()
  AWS.mocks.deleteRoleMock.mockClear()
  AWS.mocks.attachRolePolicyMock.mockClear()
  AWS.mocks.detachRolePolicyMock.mockClear()
})

afterAll(() => {
  BbPromise.delay.mockRestore()
})

describe('aws-iam-role unit tests', () => {
  it('should deploy iam component with no errors', async () => {
    const iamContextMock = {
      state: {},
      outputs: {},
      archive: {},
      log: () => {},
      saveState: () => {},
      setOutputs: jest.fn()
    }

    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }

    await iamComponent.deploy(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createRoleMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.attachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(iamContextMock.setOutputs).toBeCalledWith({
      name: inputs.name,
      arn: 'abc:xyz',
      service: inputs.service,
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    })
  })

  it('should deploy iam component a second time with no errors', async () => {
    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }
    const iamContextMock = {
      state: {
        ...inputs,
        arn: 'abc:xyz',
        policy: {
          arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
        }
      },
      outputs: {},
      archive: {},
      log: () => {},
      saveState: () => {},
      setOutputs: jest.fn()
    }
    await iamComponent.deploy(inputs, iamContextMock)
    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createRoleMock).not.toBeCalled()
    expect(AWS.mocks.attachRolePolicyMock).not.toBeCalled()
    expect(iamContextMock.setOutputs).toBeCalledWith({
      name: inputs.name,
      arn: 'abc:xyz',
      service: inputs.service,
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    })
  })

  it('should remove a non-deployed iam component with no errors', async () => {
    const iamContextMock = {
      state: {},
      outputs: {},
      archive: {},
      log: () => {},
      saveState: () => {},
      setOutputs: jest.fn()
    }
    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }
    await iamComponent.remove(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRoleMock).not.toBeCalled()
    expect(AWS.mocks.detachRolePolicyMock).not.toBeCalled()
  })

  it('should remove after a deployment with no errors', async () => {
    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }
    const iamContextMock = {
      state: {
        ...inputs,
        arn: 'abc:xyz',
        policy: {
          arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
        }
      },
      outputs: {},
      archive: {},
      log: () => {},
      saveState: () => {},
      setOutputs: jest.fn()
    }
    await iamComponent.remove(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRoleMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.detachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(iamContextMock.setOutputs).toBeCalledWith({
      name: null,
      arn: null,
      service: null,
      policy: null
    })
  })

  it('should update state when removing an already removed iam component', async () => {
    const inputs = {
      name: 'some-already-removed-role',
      service: 'lambda.amazonaws.com'
    }
    const iamContextMock = {
      state: {
        ...inputs,
        arn: 'abc:xyz',
        policy: {
          arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
        }
      },
      outputs: {},
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    await iamComponent.remove(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRoleMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.detachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(iamContextMock.saveState).toBeCalledWith({
      name: null,
      arn: null,
      service: null,
      policy: null
    })
    expect(iamContextMock.setOutputs).toBeCalledWith({
      name: null,
      arn: null,
      service: null,
      policy: null
    })
  })
})
