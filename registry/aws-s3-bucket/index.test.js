const AWS = require('aws-sdk')
const s3Component = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createBucketMock: jest.fn().mockReturnValue('bucket-abc'),
    deleteBucketMock: jest.fn(),
    listObjectsV2Mock: jest.fn().mockReturnValue({ Contents: [{ Key: 'abc' }] }),
    deleteObjectsMock: jest.fn()
  }

  const S3 = {
    createBucket: (obj) => ({
      promise: () => mocks.createBucketMock(obj)
    }),
    deleteBucket: (obj) => ({
      promise: () => mocks.deleteBucketMock(obj)
    }),
    listObjectsV2: (obj) => ({
      promise: () => mocks.listObjectsV2Mock(obj)
    }),
    deleteObjects: (obj) => ({
      promise: () => mocks.deleteObjectsMock(obj)
    })
  }
  return {
    mocks,
    S3: jest.fn().mockImplementation(() => S3)
  }
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('aws-s3-bucket tests', () => {
  it('should deploy s3 component with no errors', async () => {
    const s3ContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name'
    }

    const outputs = await s3Component.deploy(inputs, s3ContextMock)

    expect(AWS.S3).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createBucketMock).toHaveBeenCalledTimes(1)
    expect(outputs.name).toEqual(inputs.name)
    expect(s3ContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should deploy s3 component a second time with no errors', async () => {
    const s3ContextMock = {
      state: { name: 'some-bucket-name' },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name'
    }

    const outputs = await s3Component.deploy(inputs, s3ContextMock)

    expect(AWS.S3).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createBucketMock).toHaveBeenCalledTimes(1)
    expect(outputs.name).toEqual(inputs.name)
    expect(s3ContextMock.saveState).toHaveBeenCalledTimes(1)
  })
  //
  //
  // it('should remove a non-deployed component with no errors', async () => {
  //   const attachRolePolicyMock = jest.fn()
  //   const detachRolePolicyMock = jest.fn()
  //   const createRoleMock = jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } })
  //   const deleteRoleMock = jest.fn().mockReturnValue({ Role: { Arn: null } })
  //   const iamContextMock = {
  //     state: {},
  //     archive: {},
  //     log: () => {},
  //     saveState: () => {},
  //     provider: {
  //       AWS: {
  //         IAM: function () { // eslint-disable-line
  //           return {
  //             attachRolePolicy: (obj) => ({
  //               promise: () => attachRolePolicyMock(obj)
  //             }),
  //             detachRolePolicy: (obj) => ({
  //               promise: () => detachRolePolicyMock(obj)
  //             }),
  //             createRole: (obj) => ({
  //               promise: () => createRoleMock(obj)
  //             }),
  //             deleteRole: (obj) => ({
  //               promise: () => deleteRoleMock(obj)
  //             })
  //           }
  //         }
  //       }
  //     }
  //   }
  //   const inputs = {
  //     name: 'some-role',
  //     service: 'lambda.amazonaws.com'
  //   }
  //   const outputs = await iamComponent.remove(inputs, iamContextMock)
  //   expect(deleteRoleMock).not.toBeCalled()
  //   expect(detachRolePolicyMock).not.toBeCalled()
  //   expect(outputs).toEqual({})
  // })
  //
  // it('should remove after a deployment with no errors', async () => {
  //   const attachRolePolicyMock = jest.fn()
  //   const detachRolePolicyMock = jest.fn()
  //   const createRoleMock = jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } })
  //   const deleteRoleMock = jest.fn().mockReturnValue({ Role: { Arn: null } })
  //   const inputs = {
  //     name: 'some-role',
  //     service: 'lambda.amazonaws.com'
  //   }
  //   const iamContextMock = {
  //     state: {
  //       ...inputs,
  //       arn: 'abc:xyz',
  //       policy: {
  //         arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
  //       }
  //     },
  //     archive: {},
  //     log: () => {},
  //     saveState: () => {},
  //     provider: {
  //       AWS: {
  //         IAM: function () { // eslint-disable-line
  //           return {
  //             attachRolePolicy: (obj) => ({
  //               promise: () => attachRolePolicyMock(obj)
  //             }),
  //             detachRolePolicy: (obj) => ({
  //               promise: () => detachRolePolicyMock(obj)
  //             }),
  //             createRole: (obj) => ({
  //               promise: () => createRoleMock(obj)
  //             }),
  //             deleteRole: (obj) => ({
  //               promise: () => deleteRoleMock(obj)
  //             })
  //           }
  //         }
  //       }
  //     }
  //   }
  //   const outputs = await iamComponent.remove(inputs, iamContextMock)
  //   expect(deleteRoleMock).toBeCalled()
  //   expect(detachRolePolicyMock).toBeCalled()
  //   expect(outputs).toEqual({
  //     arn: null,
  //     policy: null,
  //     service: null
  //   })
  // })
})
