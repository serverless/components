const path = require('path')
const fse = require('fs-extra')
const cp = require('child_process')
const BbPromise = require('bluebird')
const { fileExists } = require('@serverless/utils')
const { removeFiles } = require('../helpers')

const fsp = BbPromise.promisifyAll(fse)
const cpp = BbPromise.promisifyAll(cp)

describe('Integration Test - Simple', () => {
  jest.setTimeout(40000)

  const testDir = path.dirname(__filename)
  const componentsExec = path.join(testDir, '..', '..', 'bin', 'components')
  const testServiceDir = path.join(testDir, 'simple')
  const testServiceStateFile = path.join(testServiceDir, 'state.json')
  const FUNCTION_NAME = 'my-function'

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
        cwd: testServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(6)
      expect(myRole).toHaveProperty('instanceId')
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('internallyManaged', false)
      expect(myRole).toHaveProperty('rootPath')
      expect(myRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 1
      })
      expect(myRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['simple:myFunction']
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
        deploymentCounter: 1,
        defaultRole: false
      })
      expect(myFunction.instanceId).not.toBeFalsy()
    })

    it('should re-deploy the "iam" and "function" components', async () => {
      await cpp.execAsync(`node ${componentsExec} deploy`, {
        cwd: testServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(6)
      expect(myRole).toHaveProperty('instanceId')
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('internallyManaged', false)
      expect(myRole).toHaveProperty('rootPath')
      expect(myRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 2
      })
      expect(myRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['simple:myFunction']
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
        deploymentCounter: 2,
        defaultRole: false
      })
      expect(myFunction.instanceId).not.toBeFalsy()
    })

    it('should invoke the "function" component with CLI options', async () => {
      await cpp.execAsync(`node ${componentsExec} invoke --data "Hello World"`, {
        cwd: testServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(6)
      expect(myRole).toHaveProperty('instanceId')
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('internallyManaged', false)
      expect(myRole).toHaveProperty('rootPath')
      expect(myRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 2
      })
      expect(myRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['simple:myFunction']
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
        deploymentCounter: 2,
        defaultRole: false,
        data: 'Hello World'
      })
      expect(myFunction.instanceId).not.toBeFalsy()
    })

    it('should persist updated state if an error occurs during command execution', async () => {
      // NOTE: we've added some logic in the function component so that it fails when the
      // third deployment is done
      // NOTE: the order of this test here is important since we're keeping and checking the
      // state file throughout the whole test suite
      const cmd = cpp.execAsync(`node ${componentsExec} deploy`, {
        cwd: testServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      await expect(cmd).rejects.toThrow('Failed to deploy function "my-function"')

      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(6)
      expect(myRole).toHaveProperty('instanceId')
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('internallyManaged', false)
      expect(myRole).toHaveProperty('rootPath')
      expect(myRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 3
      })
      expect(myRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['simple:myFunction']
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
        deploymentCounter: 2,
        defaultRole: false,
        data: 'Hello World'
      })
      expect(myFunction.instanceId).not.toBeFalsy()
    })

    it('should remove the "iam" and "function" components', async () => {
      await cpp.execAsync(`node ${componentsExec} remove`, {
        cwd: testServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(2)
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('state', {})
      const myFunction = stateFileContent['simple:myFunction']
      const myFunctionObjectKeys = Object.keys(myFunction)
      expect(myFunctionObjectKeys.length).toEqual(2)
      expect(myFunction).toHaveProperty('type', 'tests-integration-function-mock')
      expect(myFunction).toHaveProperty('state', {})
    })
  })
})
