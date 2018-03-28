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
  archive: {},
  log: () => {},
  saveState: () => {},
  provider: {
    AWS: {
      IAM: IAM // eslint-disable-line
    }
  }
}

const deployedIamContextMock = {
  archive: {
    arn: 'arn:aws:iam::377024778620:role/execution-role-xyz',
    service: 'lambda.amazonaws.com',
    policy: {
      arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
    },
    name: 'execution-role-xyz'
  },
  state: {
    arn: 'arn:aws:iam::377024778620:role/execution-role-xyz',
    service: 'lambda.amazonaws.com',
    policy: {
      arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
    },
    name: 'execution-role-xyz'
  },
  log: () => {},
  saveState: () => {},
  provider: {
    AWS: {
      IAM: IAM // eslint-disable-line
    }
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
    const outputs = await iamComponent.deploy(inputs, deployedIamContextMock)
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
    const outputs = await iamComponent.remove(inputs, deployedIamContextMock)
    expect(outputs).toEqual({
      "arn": null,
      "policy": null,
      "service": null,
    })
    // todo check methods are called
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
