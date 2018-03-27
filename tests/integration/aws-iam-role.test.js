const proxyquire =  require('proxyquire')
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

describe('Integration Test - aws-iam-role', () => {
  jest.setTimeout(10000)
  const componentsExec = path.join(__dirname, '..', '..', 'bin', 'components')
  const testServiceDir = path.join(__dirname, 'aws-iam-role')
  const testServiceStateFile = path.join(testServiceDir, 'state.json')

  beforeAll(async () => {
    await removeStateFiles([ testServiceStateFile ])
  })

  afterAll(async () => {
    await removeStateFiles([ testServiceStateFile ])
  })

  it('should deploy iam component', async () => {
    // R.equals.mockResolvedValue(true)
    try {
      await cpp.execAsync(`${componentsExec} deploy`, {
        cwd: testServiceDir,
        env: process.env
      })
    } catch (e) {
      expect(R.equals).toHaveBeenCalled()
    }
  })
})

