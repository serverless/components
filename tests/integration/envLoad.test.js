const path = require('path')
const fse = require('fs-extra')
const cp = require('child_process')
const BbPromise = require('bluebird')

const fsp = BbPromise.promisifyAll(fse)
const cpp = BbPromise.promisifyAll(cp)

async function removeStateFiles(stateFiles) {
  return BbPromise.map(stateFiles, (stateFile) => fsp.removeAsync(stateFile))
}

describe('Integration Test - Simple', () => {
  jest.setTimeout(40000)

  const testDir = path.dirname(__filename)
  const componentsExec = path.join(testDir, '..', '..', 'bin', 'components')
  const testServiceDir = path.join(testDir, 'env')
  const testServiceStateFile = path.join(testServiceDir, 'state.json')

  beforeAll(async () => {
    await removeStateFiles([ testServiceStateFile ])
  })

  afterAll(async () => {
    await removeStateFiles([ testServiceStateFile ])
  })

  describe('when running through a typical component usage lifecycle', () => {
    it('should load Variables from .env file', async () => {
      await cpp.execAsync(`node ${componentsExec} deploy`, {
        cwd: testServiceDir
      })

      const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
      const myFunction = stateFileContent['envLoad:myFunction']
      expect(myFunction).toHaveProperty('state.name', 'my-function')
    })
  })
})
