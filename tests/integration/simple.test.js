const path = require('path')
const fse = require('fs-extra')
const cp = require('child_process')
const BbPromise = require('bluebird')

const fsp = BbPromise.promisifyAll(fse)
const cpp = BbPromise.promisifyAll(cp)

// test helper methods
async function hasFile(filePath) {
  return fsp
    .statAsync(filePath)
    .then(() => true)
    .catch(() => false)
}

async function removeStateFiles(stateFiles) {
  return BbPromise.map(stateFiles, (stateFile) => fsp.removeAsync(stateFile))
}

describe('Integration Test - Simple', () => {
  jest.setTimeout(20000)

  const testDir = path.dirname(__filename)
  const componentsExec = path.join(testDir, '..', '..', 'bin', 'components')
  const FUNCTION_NAME = 'my-function'
  // The "simple" service
  const simpleServiceDir = path.join(testDir, 'simple')
  const simpleServiceStateFile = path.join(simpleServiceDir, 'state.json')
  // the "restry-remove" service
  const retryRemoveServiceDir = path.join(testDir, 'retry-remove')
  const retryRemoveStateFile = path.join(retryRemoveServiceDir, 'state.json')

  beforeAll(async () => {
    await removeStateFiles([ simpleServiceStateFile, retryRemoveStateFile ])
  })

  afterAll(async () => {
    await removeStateFiles([ simpleServiceStateFile, retryRemoveStateFile ])
  })

  describe('our test setup', () => {
    it('should not have any state files', async () => {
      const testServiceHasStateFile = await hasFile(simpleServiceStateFile)

      expect(testServiceHasStateFile).toEqual(false)
    })
  })

  describe('when running through a typical component usage lifecycle', () => {
    it('should deploy the "iam" and "function" components', async () => {
      await cpp.execAsync(`${componentsExec} deploy`, {
        cwd: simpleServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      const stateFileContent = await fsp.readJsonAsync(simpleServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(5)
      expect(myRole).toHaveProperty('instanceId')
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('internallyManaged', false)
      expect(myRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 1
      })
      expect(myRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['simple:myFunction']
      const myFunctionObjectKeys = Object.keys(myFunction)
      expect(myFunctionObjectKeys.length).toEqual(5)
      expect(myFunction).toHaveProperty('instanceId')
      expect(myFunction).toHaveProperty('type', 'tests-integration-function-mock')
      expect(myFunction).toHaveProperty('internallyManaged', false)
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
      await cpp.execAsync(`${componentsExec} deploy`, {
        cwd: simpleServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      const stateFileContent = await fsp.readJsonAsync(simpleServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(5)
      expect(myRole).toHaveProperty('instanceId')
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('internallyManaged', false)
      expect(myRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 2
      })
      expect(myRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['simple:myFunction']
      const myFunctionObjectKeys = Object.keys(myFunction)
      expect(myFunctionObjectKeys.length).toEqual(5)
      expect(myFunction).toHaveProperty('instanceId')
      expect(myFunction).toHaveProperty('type', 'tests-integration-function-mock')
      expect(myFunction).toHaveProperty('internallyManaged', false)
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
      await cpp.execAsync(`${componentsExec} invoke --data "Hello World"`, {
        cwd: simpleServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      const stateFileContent = await fsp.readJsonAsync(simpleServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(5)
      expect(myRole).toHaveProperty('instanceId')
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('internallyManaged', false)
      expect(myRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 2
      })
      expect(myRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['simple:myFunction']
      const myFunctionObjectKeys = Object.keys(myFunction)
      expect(myFunctionObjectKeys.length).toEqual(5)
      expect(myFunction).toHaveProperty('instanceId')
      expect(myFunction).toHaveProperty('type', 'tests-integration-function-mock')
      expect(myFunction).toHaveProperty('internallyManaged', false)
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
      const cmd = cpp.execAsync(`${componentsExec} deploy`, {
        cwd: simpleServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      await expect(cmd).rejects.toThrow('Failed to deploy function "my-function"')

      const stateFileContent = await fsp.readJsonAsync(simpleServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(5)
      expect(myRole).toHaveProperty('instanceId')
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('internallyManaged', false)
      expect(myRole).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 3
      })
      expect(myRole.instanceId).not.toBeFalsy()
      const myFunction = stateFileContent['simple:myFunction']
      const myFunctionObjectKeys = Object.keys(myFunction)
      expect(myFunctionObjectKeys.length).toEqual(5)
      expect(myFunction).toHaveProperty('instanceId')
      expect(myFunction).toHaveProperty('type', 'tests-integration-function-mock')
      expect(myFunction).toHaveProperty('internallyManaged', false)
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
      await cpp.execAsync(`${componentsExec} remove`, {
        cwd: simpleServiceDir,
        env: {
          ...process.env,
          FUNCTION_NAME
        }
      })
      const stateFileContent = await fsp.readJsonAsync(simpleServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('simple:myRole')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const myRole = stateFileContent['simple:myRole']
      const myRoleObjectKeys = Object.keys(myRole)
      expect(myRoleObjectKeys.length).toEqual(5)
      expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(myRole).toHaveProperty('state', {})
      const myFunction = stateFileContent['simple:myFunction']
      expect(myFunction).toHaveProperty('type', 'tests-integration-function-mock')
      expect(myFunction).toHaveProperty('state', {})
    })
  })

  describe('when a component requires multiple removal attempts', () => {
    it('saves the state if deployment fails', async () => {
      await expect(cpp.execAsync(`${componentsExec} deploy`, {
        cwd: retryRemoveServiceDir
      })).rejects.toThrow(/during deployment/)
      const stateFileContent = await fsp.readJsonAsync(retryRemoveStateFile)
      expect(stateFileContent).toHaveProperty('retry-remove.state.deployed', true)
    })

    it('keeps its state after the first remove', async () => {
      await cpp.execAsync(`${componentsExec} remove`, {
        cwd: retryRemoveServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(retryRemoveStateFile)
      expect(stateFileContent).toHaveProperty('retry-remove.state.deployed', true)
    })

    it('clears its state after the second remove', async () => {
      await cpp.execAsync(`${componentsExec} remove`, {
        cwd: retryRemoveServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(retryRemoveStateFile)
      expect(stateFileContent).not.toHaveProperty('retry-remove.state.deployed')
    })
  })
})
