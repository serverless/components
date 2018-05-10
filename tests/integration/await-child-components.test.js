const path = require('path')
const fse = require('fs-extra')
const cp = require('child_process')
const BbPromise = require('bluebird')
const { fileExists } = require('@serverless/utils')
const { removeFiles } = require('../helpers')

const fsp = BbPromise.promisifyAll(fse)
const cpp = BbPromise.promisifyAll(cp)

describe('Integration Test - Await child components', () => {
  jest.setTimeout(40000)

  const testDir = path.dirname(__filename)
  const componentsExec = path.join(testDir, '..', '..', 'bin', 'components')
  const testServiceDir = path.join(testDir, 'await-child-components')
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
    it('should deploy the "function" component and await its deployment', async () => {
      await cpp.execAsync(`node ${componentsExec} deploy`, {
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
      expect(awaitChildComponentsObjectKeys.length).toEqual(6)
      expect(awaitChildComponents).toHaveProperty('instanceId')
      expect(awaitChildComponents).toHaveProperty('type', 'await-child-components')
      expect(awaitChildComponents).toHaveProperty('internallyManaged', false)
      expect(awaitChildComponents).toHaveProperty('rootPath')
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
      await cpp.execAsync(`node ${componentsExec} remove`, {
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
      expect(awaitChildComponentsObjectKeys.length).toEqual(2)
      expect(awaitChildComponents).toHaveProperty('type', 'await-child-components')
      expect(awaitChildComponents).toHaveProperty('state', {})
    })
  })
})
