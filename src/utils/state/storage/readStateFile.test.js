const { getTmpDir, writeFile } = require('@serverless/utils')
const path = require('path')
const readStateFile = require('./readStateFile')

describe('#readStateFile()', () => {
  let oldCwd
  let tmpDirPath
  let stateFilePath
  let projectPath

  const fileContent = {
    $: { serviceId: 'AsH3gefdfDSY' },
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
    await writeFile(stateFilePath, fileContent)
    projectPath = tmpDirPath
    oldCwd = process.cwd()
    process.chdir(tmpDirPath)
  })

  afterEach(() => {
    process.chdir(oldCwd)
  })

  it('should read the projects state file if present', async () => {
    const res = await readStateFile(projectPath)
    expect(res).toEqual(fileContent)
  })

  it('should return an empty object if the project does not contain a state file', async () => {
    projectPath = await getTmpDir()
    const res = await readStateFile(projectPath)
    expect(res).toEqual({})
  })
})
