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

describe('Integration Test - Await child components', () => {
  jest.setTimeout(20000)

  const testDir = path.dirname(__filename)
  const componentsExec = path.join(testDir, '..', '..', 'bin', 'components')
  const testServiceDir = path.join(testDir, 'await-child-components')
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
    it('should deploy the "function" component and await its deployment', async () => {
      await cpp.execAsync(`${componentsExec} deploy`, {
        cwd: testServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('await-child-components')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const awaitChildComponents = stateFileContent['await-child-components']
      const awaitChildComponentsObjectKeys = Object.keys(awaitChildComponents)
      expect(awaitChildComponentsObjectKeys.length).toEqual(5)
      expect(awaitChildComponents).toHaveProperty('instanceId')
      expect(awaitChildComponents).toHaveProperty('type', 'await-child-components')
      expect(awaitChildComponents).toHaveProperty('internallyManaged', false)
      expect(awaitChildComponents).toHaveProperty(
        'state.myFunction.state.id',
        'id:function:my-function'
      )
      expect(awaitChildComponents).toHaveProperty('state.myFunction.state.deploymentCounter', 1)
      expect(awaitChildComponents).toHaveProperty('state.myFunction.outputs', {
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
        defaultRole: {
          id: 'id:iam:role:my-function',
          name: 'my-function',
          service: 'default.serverless.service',
          deploymentCounter: 1
        }
      })
      expect(awaitChildComponents.instanceId).not.toBeFalsy()
    })

    it('should remove the "function" component', async () => {
      await cpp.execAsync(`${componentsExec} remove`, {
        cwd: testServiceDir
      })
      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const stateFileKeys = Object.keys(stateFileContent)
      expect(stateFileKeys.length).toEqual(4)
      expect(stateFileContent).toHaveProperty('$.serviceId')
      expect(stateFileContent).toHaveProperty('await-child-components')
      expect(stateFileContent.$.serviceId).not.toBeFalsy()
      const awaitChildComponents = stateFileContent['await-child-components']
      expect(awaitChildComponents).toHaveProperty('type', 'await-child-components')
      expect(awaitChildComponents).toHaveProperty('state', {})
    })
  })
})
