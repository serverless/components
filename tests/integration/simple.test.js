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
  jest.setTimeout(10000)

  const testDir = path.dirname(require.main.filename)
  const componentsExec = path.join(testDir, '..', '..', 'bin', 'components')
  const testServiceDir = path.join(testDir, 'simple')
  const testServiceStateFile = path.join(testServiceDir, 'state.json')
  const FUNCTION_NAME = 'my-function'

  beforeAll(async () => {
    await removeStateFiles([ testServiceStateFile ])
  })

  afterAll(async () => {
    await removeStateFiles([ testServiceStateFile ])
  })

  describe('our test setup', () => {
    it('should not have any state files', async () => {
      const testServiceHasStateFile = await hasFile(testServiceStateFile)

      expect(testServiceHasStateFile).toEqual(false)
    })
  })

  describe('when running through a typical component usage lifecycle', () => {
    it('should deploy the "iam" and "function" components', async () => {
      await cpp.execAsync(`${componentsExec} deploy`, {
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
      const myRoleObjectKeys = Object.keys(stateFileContent['simple:myRole'])
      expect(myRoleObjectKeys.length).toEqual(4)
      expect(stateFileContent['simple:myRole']).toHaveProperty('instanceId')
      expect(stateFileContent['simple:myRole']).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(stateFileContent['simple:myRole']).toHaveProperty('internallyManaged', false)
      expect(stateFileContent['simple:myRole']).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 1
      })
      const myFunctionObjectKeys = Object.keys(stateFileContent['simple:myFunction'])
      expect(myFunctionObjectKeys.length).toEqual(4)
      expect(stateFileContent['simple:myFunction']).toHaveProperty('instanceId')
      expect(stateFileContent['simple:myFunction']).toHaveProperty(
        'type',
        'tests-integration-function-mock'
      )
      expect(stateFileContent['simple:myFunction']).toHaveProperty('internallyManaged', false)
      expect(stateFileContent['simple:myFunction']).toHaveProperty('state', {
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
    })

    it('should re-deploy the "iam" and "function" components', async () => {
      await cpp.execAsync(`${componentsExec} deploy`, {
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
      const myRoleObjectKeys = Object.keys(stateFileContent['simple:myRole'])
      expect(myRoleObjectKeys.length).toEqual(4)
      expect(stateFileContent['simple:myRole']).toHaveProperty('instanceId')
      expect(stateFileContent['simple:myRole']).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(stateFileContent['simple:myRole']).toHaveProperty('internallyManaged', false)
      expect(stateFileContent['simple:myRole']).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 2
      })
      const myFunctionObjectKeys = Object.keys(stateFileContent['simple:myFunction'])
      expect(myFunctionObjectKeys.length).toEqual(4)
      expect(stateFileContent['simple:myFunction']).toHaveProperty('instanceId')
      expect(stateFileContent['simple:myFunction']).toHaveProperty(
        'type',
        'tests-integration-function-mock'
      )
      expect(stateFileContent['simple:myFunction']).toHaveProperty('internallyManaged', false)
      expect(stateFileContent['simple:myFunction']).toHaveProperty('state', {
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
    })

    it('should invoke the "function" component with CLI options', async () => {
      await cpp.execAsync(`${componentsExec} invoke --data "Hello World"`, {
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
      const myRoleObjectKeys = Object.keys(stateFileContent['simple:myRole'])
      expect(myRoleObjectKeys.length).toEqual(4)
      expect(stateFileContent['simple:myRole']).toHaveProperty('instanceId')
      expect(stateFileContent['simple:myRole']).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(stateFileContent['simple:myRole']).toHaveProperty('internallyManaged', false)
      expect(stateFileContent['simple:myRole']).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 2
      })
      const myFunctionObjectKeys = Object.keys(stateFileContent['simple:myFunction'])
      expect(myFunctionObjectKeys.length).toEqual(4)
      expect(stateFileContent['simple:myFunction']).toHaveProperty('instanceId')
      expect(stateFileContent['simple:myFunction']).toHaveProperty(
        'type',
        'tests-integration-function-mock'
      )
      expect(stateFileContent['simple:myFunction']).toHaveProperty('internallyManaged', false)
      expect(stateFileContent['simple:myFunction']).toHaveProperty('state', {
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
    })

    it('should persist updated state if an error occurs during command execution', async () => {
      // NOTE: we've added some logic in the function component so that it fails when the
      // third deployment is done
      // NOTE: the order of this test here is important since we're keeping and checking the
      // state file throughout the whole test suite
      const cmd = cpp.execAsync(`${componentsExec} deploy`, {
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
      const myRoleObjectKeys = Object.keys(stateFileContent['simple:myRole'])
      expect(myRoleObjectKeys.length).toEqual(4)
      expect(stateFileContent['simple:myRole']).toHaveProperty('instanceId')
      expect(stateFileContent['simple:myRole']).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(stateFileContent['simple:myRole']).toHaveProperty('internallyManaged', false)
      expect(stateFileContent['simple:myRole']).toHaveProperty('state', {
        id: 'id:iam:role:my-function',
        name: 'my-function',
        service: 'my.function.service',
        deploymentCounter: 3
      })
      const myFunctionObjectKeys = Object.keys(stateFileContent['simple:myFunction'])
      expect(myFunctionObjectKeys.length).toEqual(4)
      expect(stateFileContent['simple:myFunction']).toHaveProperty('instanceId')
      expect(stateFileContent['simple:myFunction']).toHaveProperty(
        'type',
        'tests-integration-function-mock'
      )
      expect(stateFileContent['simple:myFunction']).toHaveProperty('internallyManaged', false)
      expect(stateFileContent['simple:myFunction']).toHaveProperty('state', {
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
    })

    it('should remove the "iam" and "function" components', async () => {
      await cpp.execAsync(`${componentsExec} remove`, {
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
      expect(stateFileContent['simple:myRole']).toHaveProperty('type', 'tests-integration-iam-mock')
      expect(stateFileContent['simple:myRole']).toHaveProperty('state', {})
      expect(stateFileContent['simple:myFunction']).toHaveProperty(
        'type',
        'tests-integration-function-mock'
      )
      expect(stateFileContent['simple:myFunction']).toHaveProperty('state', {})
    })
  })
})
