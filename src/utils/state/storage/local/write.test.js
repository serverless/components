const { getTmpDir } = require('@serverless/utils')
const { readJson } = require('fs-extra')
const path = require('path')
const writeStateFile = require('./write')

describe('#writeStateFile()', () => {
  let oldCwd
  let tmpDirPath
  let stateFilePath
  let projectPath

  const fileContent = {
    $: { appId: 'AsH3gefdfDSY' },
    'myApp:myFunction': {
      type: 'aws-iam-function',
      internallyManaged: false,
      state: {
        name: 'my-function',
        memorySize: 512,
        timeout: 60
      }
    },
    'myApp:myRole': {
      type: 'aws-iam-role',
      internallyManaged: false,
      state: {
        name: 'my-role',
        service: 'some.serverless.service'
      }
    }
  }

  beforeEach(async () => {
    tmpDirPath = await getTmpDir()
    stateFilePath = path.join(tmpDirPath, 'state.json')
    projectPath = tmpDirPath
    oldCwd = process.cwd()
    process.chdir(tmpDirPath)
  })

  afterEach(() => {
    process.chdir(oldCwd)
  })

  it('should write the content to disk', async () => {
    await writeStateFile({ projectPath }, fileContent)
    const stateFileContent = await readJson(stateFilePath)
    expect(stateFileContent).toEqual(fileContent)
  })

  it('should write the content to disk when state file is defined in config', async () => {
    await writeStateFile({ projectPath, state: { file: 'state.json' } }, fileContent)
    const stateFileContent = await readJson(stateFilePath)
    expect(stateFileContent).toEqual(fileContent)
  })
})
