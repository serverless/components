const path = require('path')
const fse = require('fs-extra')
const cp = require('child_process')
const BbPromise = require('bluebird')
const { fileExists } = require('@serverless/utils')
const { removeFiles } = require('../helpers')

const fsp = BbPromise.promisifyAll(fse)
const cpp = BbPromise.promisifyAll(cp)

describe('Integration Test - Programmatic usage', () => {
  jest.setTimeout(40000)

  const testDir = path.dirname(__filename)
  const componentsExec = path.join(testDir, '..', '..', 'bin', 'components')
  const testServiceDir = path.join(testDir, 'programmatic-usage')
  const testServiceStateFile = path.join(testServiceDir, 'state.json')

  beforeAll(async () => {
    await removeFiles([testServiceStateFile])
  })

  afterAll(async () => {
    await removeFiles([testServiceStateFile])
  })

  describe('our test setup', () => {
    it('should not have any state files', async () => {
      const testServiceHasStateFile = await fileExists(testServiceStateFile)

      expect(testServiceHasStateFile).toEqual(false)
    })
  })

  describe('when running through a typical component usage lifecycle', () => {
    it('should deploy the "iam" and "function" components', async () => {
      await cpp.execAsync(`node ${componentsExec} deploy`, {
        cwd: testServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('programmatic-usage:myFunction:defaultRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const defaultRole = stateFileContent['programmatic-usage:myFunction:defaultRole']
      const defaultRoleObjectKeys = Object.keys(defaultRole)
      expect(defaultRoleObjectKeys.length).toEqual(6)
      expect(defaultRole).toHaveProperty('instanceId')
      expect(defaultRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(defaultRole).toHaveProperty('internallyManaged', true)
      expect(defaultRole).toHaveProperty('rootPath')
      expect(defaultRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'default.serverless.service',
        deploymentCounter: 1
      })
      expect(defaultRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['programmatic-usage:myFunction']
      const myFunctionObjectKeys = Object.keys(myFunction)
      expect(myFunctionObjectKeys.length).toEqual(6)
      expect(myFunction).toHaveProperty('instanceId')
      expect(myFunction).toHaveProperty('type', 'tests-integration-function-mock')
      expect(myFunction).toHaveProperty('internallyManaged', false)
      expect(myFunction).toHaveProperty('rootPath')
      expect(myFunction).toHaveProperty('state', {
        id: 'id:function:my-function',
        name: 'my-function',
        memorySize: 512,
        timeout: 60,
        environment: {
          isMock: true,
          variables: {
            key1: 'value1'
          }
        },
        role: 'id:iam:role:my-function',
        defaultRole: {
          id: 'id:iam:role:my-function',
          name: 'my-function',
          service: 'default.serverless.service',
          deploymentCounter: 1
        },
        deploymentCounter: 1
      })
      expect(myFunction.instanceId).not.toBeFalsy()
    })

    it('should re-deploy the "iam" and "function" components', async () => {
      await cpp.execAsync(`node ${componentsExec} deploy`, {
        cwd: testServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('programmatic-usage:myFunction:defaultRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const defaultRole = stateFileContent['programmatic-usage:myFunction:defaultRole']
      const defaultRoleObjectKeys = Object.keys(defaultRole)
      expect(defaultRoleObjectKeys.length).toEqual(6)
      expect(defaultRole).toHaveProperty('instanceId')
      expect(defaultRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(defaultRole).toHaveProperty('internallyManaged', true)
      expect(defaultRole).toHaveProperty('rootPath')
      expect(defaultRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'default.serverless.service',
        deploymentCounter: 2
      })
      expect(defaultRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['programmatic-usage:myFunction']
      const myFunctionObjectKeys = Object.keys(myFunction)
      expect(myFunctionObjectKeys.length).toEqual(6)
      expect(myFunction).toHaveProperty('instanceId')
      expect(myFunction).toHaveProperty('type', 'tests-integration-function-mock')
      expect(myFunction).toHaveProperty('internallyManaged', false)
      expect(myFunction).toHaveProperty('rootPath')
      expect(myFunction).toHaveProperty('state', {
        id: 'id:function:my-function',
        name: 'my-function',
        memorySize: 512,
        timeout: 60,
        environment: {
          isMock: true,
          variables: {
            key1: 'value1'
          }
        },
        role: 'id:iam:role:my-function',
        defaultRole: {
          id: 'id:iam:role:my-function',
          name: 'my-function',
          service: 'default.serverless.service',
          deploymentCounter: 2
        },
        deploymentCounter: 2
      })
      expect(myFunction.instanceId).not.toBeFalsy()
    })

    it('should remove the "iam" and "function" components', async () => {
      await cpp.execAsync(`node ${componentsExec} remove`, {
        cwd: testServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('programmatic-usage:myFunction:defaultRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const defaultRole = stateFileContent['programmatic-usage:myFunction:defaultRole']
      const defaultRoleObjectKeys = Object.keys(defaultRole)
      expect(defaultRoleObjectKeys.length).toEqual(6)
      expect(defaultRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(defaultRole).toHaveProperty('state', {})
      const myFunction = stateFileContent['programmatic-usage:myFunction']
      const myFunctionObjectKeys = Object.keys(myFunction)
      expect(myFunctionObjectKeys.length).toEqual(2)
      expect(myFunction).toHaveProperty('type', 'tests-integration-function-mock')
      expect(myFunction).toHaveProperty('state', {})
    })
  })
})
