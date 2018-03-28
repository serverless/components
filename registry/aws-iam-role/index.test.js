const BbPromise = require('bluebird')
const iamComponent = require('./index')

jest.mock('bluebird', () => ({
  delay: jest.fn(() => Promise.resolve())
}))

afterAll(() => {
  BbPromise.delay.mockRestore()
})

describe('aws-iam-role unit tests', () => {
  it('should deploy iam component with no errors', async () => {
    const attachRolePolicyMock = jest.fn()
    const detachRolePolicyMock = jest.fn()
    const createRoleMock = jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } })
    const deleteRoleMock = jest.fn().mockReturnValue({ Role: { Arn: null } })
    const iamContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: () => {},
      provider: {
        AWS: {
          IAM: function () { // eslint-disable-line
            return {
              attachRolePolicy: (obj) => ({
                promise: () => attachRolePolicyMock(obj)
              }),
              detachRolePolicy: (obj) => ({
                promise: () => detachRolePolicyMock(obj)
              }),
              createRole: (obj) => ({
                promise: () => createRoleMock(obj)
              }),
              deleteRole: (obj) => ({
                promise: () => deleteRoleMock(obj)
              })
            }
          }
        }
      }
    }

    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }

    const outputs = await iamComponent.deploy(inputs, iamContextMock)

    expect(createRoleMock).toBeCalled()
    expect(attachRolePolicyMock).toBeCalled()
    expect(outputs.name).toEqual(inputs.name)
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.service).toEqual(inputs.service)
  })

  it('should deploy iam component a second time with no errors', async () => {
    const attachRolePolicyMock = jest.fn()
    const detachRolePolicyMock = jest.fn()
    const createRoleMock = jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } })
    const deleteRoleMock = jest.fn().mockReturnValue({ Role: { Arn: null } })
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
      archive: {},
      log: () => {},
      saveState: () => {},
      provider: {
        AWS: {
          IAM: function () { // eslint-disable-line
            return {
              attachRolePolicy: (obj) => ({
                promise: () => attachRolePolicyMock(obj)
              }),
              detachRolePolicy: (obj) => ({
                promise: () => detachRolePolicyMock(obj)
              }),
              createRole: (obj) => ({
                promise: () => createRoleMock(obj)
              }),
              deleteRole: (obj) => ({
                promise: () => deleteRoleMock(obj)
              })
            }
          }
        }
      }
    }
    const outputs = await iamComponent.deploy(inputs, iamContextMock)
    expect(createRoleMock).not.toBeCalled()
    expect(attachRolePolicyMock).not.toBeCalled()
    expect(outputs.name).toEqual(inputs.name)
    expect(outputs.arn).toEqual('abc:xyz')
    expect(outputs.service).toEqual(inputs.service)
  })


  it('should remove a non-deployed component with no errors', async () => {
    const attachRolePolicyMock = jest.fn()
    const detachRolePolicyMock = jest.fn()
    const createRoleMock = jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } })
    const deleteRoleMock = jest.fn().mockReturnValue({ Role: { Arn: null } })
    const iamContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: () => {},
      provider: {
        AWS: {
          IAM: function () { // eslint-disable-line
            return {
              attachRolePolicy: (obj) => ({
                promise: () => attachRolePolicyMock(obj)
              }),
              detachRolePolicy: (obj) => ({
                promise: () => detachRolePolicyMock(obj)
              }),
              createRole: (obj) => ({
                promise: () => createRoleMock(obj)
              }),
              deleteRole: (obj) => ({
                promise: () => deleteRoleMock(obj)
              })
            }
          }
        }
      }
    }
    const inputs = {
      name: 'some-role',
      service: 'lambda.amazonaws.com'
    }
    const outputs = await iamComponent.remove(inputs, iamContextMock)
    expect(deleteRoleMock).not.toBeCalled()
    expect(detachRolePolicyMock).not.toBeCalled()
    expect(outputs).toEqual({})
  })

  it('should remove after a deployment with no errors', async () => {
    const attachRolePolicyMock = jest.fn()
    const detachRolePolicyMock = jest.fn()
    const createRoleMock = jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } })
    const deleteRoleMock = jest.fn().mockReturnValue({ Role: { Arn: null } })
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
      archive: {},
      log: () => {},
      saveState: () => {},
      provider: {
        AWS: {
          IAM: function () { // eslint-disable-line
            return {
              attachRolePolicy: (obj) => ({
                promise: () => attachRolePolicyMock(obj)
              }),
              detachRolePolicy: (obj) => ({
                promise: () => detachRolePolicyMock(obj)
              }),
              createRole: (obj) => ({
                promise: () => createRoleMock(obj)
              }),
              deleteRole: (obj) => ({
                promise: () => deleteRoleMock(obj)
              })
            }
          }
        }
      }
    }
    const outputs = await iamComponent.remove(inputs, iamContextMock)
    expect(deleteRoleMock).toBeCalled()
    expect(detachRolePolicyMock).toBeCalled()
    expect(outputs).toEqual({
      arn: null,
      policy: null,
      service: null
    })
  })
})

// Response shapes for future integration tests

/* IAM.createRole response
{
  ResponseMetadata: {
    RequestId: 'd869a586-3243-11e8-8fac-5d44af6c236c'
  },
  Role: {
    Path: '/',
    RoleName: 'execution-role-xyz',
    RoleId: 'AROAJG3CJZA72EGXABXUI',
    Arn: 'arn:aws:iam::377024778620:role/execution-role-xyz',
    CreateDate: 2018-03-28T04:52:41.012Z,
    AssumeRolePolicyDocument: '%7B%22Version%22%3A%222012-10-17%22%2C%2'
   }
 }
 */


/* IAM.deleteRole response
  {
    ResponseMetadata: {
      RequestId: 'faaac346-3244-11e8-8645-4753c21e0760'
    }
  }
*/
