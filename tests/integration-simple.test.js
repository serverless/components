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
  const testDir = path.dirname(require.main.filename)
  const serverlessExec = path.join(testDir, '..', 'bin', 'serverless')
  const iamMockDir = path.join(testDir, '..', 'registry', 'tests-integration-iam-mock')
  const functionMockDir = path.join(testDir, '..', 'registry', 'tests-integration-function-mock')
  const iamMockStateFile = path.join(iamMockDir, 'state.json')
  const functionMockStateFile = path.join(functionMockDir, 'state.json')

  beforeAll(async () => {
    await removeStateFiles([ iamMockStateFile, functionMockStateFile ])
  })

  afterAll(async () => {
    await removeStateFiles([ iamMockStateFile, functionMockStateFile ])
  })

  describe(
    'our test setup',
    () => {
      it('should not have any state files', async () => {
        const iamMockHasStateFile = await hasFile(iamMockStateFile)
        const functionMockHasStateFile = await hasFile(functionMockStateFile)

        expect(iamMockHasStateFile).toEqual(false)
        expect(functionMockHasStateFile).toEqual(false)
      })
    },
    10000
  )

  describe(
    'when running through a typical component usage lifecycle',
    () => {
      it('should deploy the "iam" and "function" components', async () => {
        await cpp.execAsync(`${serverlessExec} deploy`, {
          cwd: functionMockDir,
          env: { FUNCTION_NAME: 'my-function' }
        })
        const stateFileContent = await fsp.readJsonAsync(functionMockStateFile)
        const expected = {
          'tests-integration-function-mock:myRole': {
            name: 'my-function',
            service: 'my.function.service',
            id: 'id:iam:role:my-function',
            deploymentCounter: 1
          },
          'tests-integration-function-mock': {
            name: 'my-function',
            memorySize: 512,
            timeout: 100,
            role: 'id:iam:role:my-function',
            id: 'id:function:my-function',
            deploymentCounter: 1
          }
        }
        expect(stateFileContent).toEqual(expected)
      })

      it('should re-deploy the "iam" and "function" components', async () => {
        await cpp.execAsync(`${serverlessExec} deploy`, {
          cwd: functionMockDir,
          env: { FUNCTION_NAME: 'my-function' }
        })
        const stateFileContent = await fsp.readJsonAsync(functionMockStateFile)
        const expected = {
          'tests-integration-function-mock:myRole': {
            name: 'my-function',
            service: 'my.function.service',
            id: 'id:iam:role:my-function',
            deploymentCounter: 2
          },
          'tests-integration-function-mock': {
            name: 'my-function',
            memorySize: 512,
            timeout: 100,
            role: 'id:iam:role:my-function',
            id: 'id:function:my-function',
            deploymentCounter: 2
          }
        }
        expect(stateFileContent).toEqual(expected)
      })

      it('should invoke the "function" component with CLI options', async () => {
        await cpp.execAsync(`${serverlessExec} invoke --data "Hello World"`, {
          cwd: functionMockDir
        })
        const stateFileContent = await fsp.readJsonAsync(functionMockStateFile)
        const expected = {
          'tests-integration-function-mock:myRole': {
            name: 'my-function',
            service: 'my.function.service',
            id: 'id:iam:role:my-function',
            deploymentCounter: 2
          },
          'tests-integration-function-mock': {
            name: 'my-function',
            memorySize: 512,
            timeout: 100,
            role: 'id:iam:role:my-function',
            id: 'id:function:my-function',
            deploymentCounter: 2,
            data: 'Hello World'
          }
        }
        expect(stateFileContent).toEqual(expected)
      })

      it('should remove the "iam" and "function" components', async () => {
        await cpp.execAsync(`${serverlessExec} remove`, { cwd: functionMockDir })
        const stateFileContent = await fsp.readJsonAsync(functionMockStateFile)
        const expected = {
          'tests-integration-function-mock:myRole': {},
          'tests-integration-function-mock': {}
        }
        expect(stateFileContent).toEqual(expected)
      })
    },
    10000
  )
})
