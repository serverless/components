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
  const componentsExec = path.join(testDir, '..', 'bin', 'components')
  const iamMockDir = path.join(testDir, '..', 'registry', 'tests-integration-iam-mock')
  const functionMockDir = path.join(testDir, '..', 'registry', 'tests-integration-function-mock')
  const iamMockStateFile = path.join(iamMockDir, 'state.json')
  const functionMockStateFile = path.join(functionMockDir, 'state.json')
  const FUNCTION_NAME = 'my-function'

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
        await cpp.execAsync(`${componentsExec} deploy`, {
          cwd: functionMockDir,
          env: {
            ...process.env,
            FUNCTION_NAME
          }
        })
        const stateFileContent = await fsp.readJsonAsync(functionMockStateFile)
        const expected = {
          'tests-integration-function-mock:myRole': {
            type: 'tests-integration-iam-mock',
            state: {
              id: 'id:iam:role:my-function',
              name: 'my-function',
              deploymentCounter: 1
            }
          },
          'tests-integration-function-mock': {
            type: 'tests-integration-function-mock',
            state: {
              id: 'id:function:my-function',
              name: 'my-function',
              role: 'id:iam:role:my-function',
              deploymentCounter: 1
            }
          }
        }
        expect(stateFileContent).toEqual(expected)
      })

      it('should re-deploy the "iam" and "function" components', async () => {
        await cpp.execAsync(`${componentsExec} deploy`, {
          cwd: functionMockDir,
          env: {
            ...process.env,
            FUNCTION_NAME
          }
        })
        const stateFileContent = await fsp.readJsonAsync(functionMockStateFile)
        const expected = {
          'tests-integration-function-mock:myRole': {
            type: 'tests-integration-iam-mock',
            state: {
              id: 'id:iam:role:my-function',
              name: 'my-function',
              deploymentCounter: 2
            }
          },
          'tests-integration-function-mock': {
            type: 'tests-integration-function-mock',
            state: {
              id: 'id:function:my-function',
              name: 'my-function',
              role: 'id:iam:role:my-function',
              deploymentCounter: 2
            }
          }
        }
        expect(stateFileContent).toEqual(expected)
      })

      it('should invoke the "function" component with CLI options', async () => {
        await cpp.execAsync(`${componentsExec} invoke --data "Hello World"`, {
          cwd: functionMockDir
        })
        const stateFileContent = await fsp.readJsonAsync(functionMockStateFile)
        const expected = {
          'tests-integration-function-mock:myRole': {
            type: 'tests-integration-iam-mock',
            state: {
              id: 'id:iam:role:my-function',
              name: 'my-function',
              deploymentCounter: 2
            }
          },
          'tests-integration-function-mock': {
            type: 'tests-integration-function-mock',
            state: {
              id: 'id:function:my-function',
              name: 'my-function',
              role: 'id:iam:role:my-function',
              deploymentCounter: 2,
              data: 'Hello World'
            }
          }
        }
        expect(stateFileContent).toEqual(expected)
      })

      it('should save the current state if an error occurs during command execution', async () => {
        // NOTE: we've added some logic in the function component so that it fails when the
        // third deployment is done
        // NOTE: the order of this test here is important since we're keeping and checking the
        // state file throughout the whole test suite
        const cmd = cpp.execAsync(`${componentsExec} deploy`, {
          cwd: functionMockDir,
          env: {
            ...process.env,
            FUNCTION_NAME
          }
        })
        await expect(cmd).rejects.toThrow('Failed to deploy function "my-function"')

        const stateFileContent = await fsp.readJsonAsync(functionMockStateFile)
        const expected = {
          'tests-integration-function-mock:myRole': {
            type: 'tests-integration-iam-mock',
            state: {
              id: 'id:iam:role:my-function',
              name: 'my-function',
              deploymentCounter: 3
            }
          },
          'tests-integration-function-mock': {
            type: 'tests-integration-function-mock',
            state: {
              id: 'id:function:my-function',
              name: 'my-function',
              role: 'id:iam:role:my-function',
              deploymentCounter: 2,
              data: 'Hello World'
            }
          }
        }
        expect(stateFileContent).toEqual(expected)
      })

      it('should remove the "iam" and "function" components', async () => {
        await cpp.execAsync(`${componentsExec} remove`, { cwd: functionMockDir })
        const stateFileContent = await fsp.readJsonAsync(functionMockStateFile)
        const expected = {
          'tests-integration-function-mock:myRole': {
            type: 'tests-integration-iam-mock',
            state: {}
          },
          'tests-integration-function-mock': {
            type: 'tests-integration-function-mock',
            state: {}
          }
        }
        expect(stateFileContent).toEqual(expected)
      })
    },
    10000
  )
})
