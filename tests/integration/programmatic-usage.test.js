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

describe('Integration Test - Programmatic usage', () => {
  jest.setTimeout(10000)

  const testDir = path.dirname(require.main.filename)
  const componentsExec = path.join(testDir, '..', '..', 'bin', 'components')
  const testServiceDir = path.join(testDir, 'programmatic-usage')
  const testServiceStateFile = path.join(testServiceDir, 'state.json')

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
        cwd: testServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(3)
      expect(stateFileContent).toHaveProperty('serviceId')
      expect(stateFileContent).toHaveProperty('programmatic-usage:myFunction:defaultRole')
      const myRoleObjectKeys = Object.keys(stateFileContent['programmatic-usage:myFunction:defaultRole'])
      expect(myRoleObjectKeys.length).toEqual(4)
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty('instanceId')
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty(
        'type',
        'tests-integration-iam-mock'
      )
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty(
        'internallyManaged',
        true
      )
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty(
        'state',
        {
          id: 'id:iam:role:my-function',
          name: 'my-function',
          service: 'default.serverless.service',
          deploymentCounter: 1
        }
      )
      const myFunctionObjectKeys = Object.keys(stateFileContent['programmatic-usage:myFunction'])
      expect(myFunctionObjectKeys.length).toEqual(4)
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty('instanceId')
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty(
        'type',
        'tests-integration-function-mock'
      )
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty(
        'internallyManaged',
        false
      )
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty('state', {
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
    })

    it('should re-deploy the "iam" and "function" components', async () => {
      await cpp.execAsync(`${componentsExec} deploy`, {
        cwd: testServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(3)
      expect(stateFileContent).toHaveProperty('serviceId')
      expect(stateFileContent).toHaveProperty('programmatic-usage:myFunction:defaultRole')
      const myRoleObjectKeys = Object.keys(stateFileContent['programmatic-usage:myFunction:defaultRole'])
      expect(myRoleObjectKeys.length).toEqual(4)
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty('instanceId')
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty(
        'type',
        'tests-integration-iam-mock'
      )
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty(
        'internallyManaged',
        true
      )
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty(
        'state',
        {
          id: 'id:iam:role:my-function',
          name: 'my-function',
          service: 'default.serverless.service',
          deploymentCounter: 2
        }
      )
      const myFunctionObjectKeys = Object.keys(stateFileContent['programmatic-usage:myFunction'])
      expect(myFunctionObjectKeys.length).toEqual(4)
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty('instanceId')
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty(
        'type',
        'tests-integration-function-mock'
      )
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty(
        'internallyManaged',
        false
      )
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty('state', {
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
    })

    it('should remove the "iam" and "function" components', async () => {
      await cpp.execAsync(`${componentsExec} remove`, {
        cwd: testServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('serviceId')
      expect(stateFileContent).toHaveProperty('programmatic-usage:myFunction:defaultRole')
      const myRoleObjectKeys = Object.keys(stateFileContent['programmatic-usage:myFunction:defaultRole'])
      expect(myRoleObjectKeys.length).toEqual(4)
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty(
        'type',
        'tests-integration-iam-mock'
      )
      expect(stateFileContent['programmatic-usage:myFunction:defaultRole']).toHaveProperty(
        'state',
        {}
      )
      const myFunctionObjectKeys = Object.keys(stateFileContent['programmatic-usage:myFunction'])
      expect(myFunctionObjectKeys.length).toEqual(2)
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty(
        'type',
        'tests-integration-function-mock'
      )
      expect(stateFileContent['programmatic-usage:myFunction']).toHaveProperty('state', {})
    })
  })
})
