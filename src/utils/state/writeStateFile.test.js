const path = require('path')
const { keys, assoc } = require('ramda')
const writeStateFile = require('./writeStateFile')
const getTmpDir = require('../fs/getTmpDir')
const fse = require('../fs/fse')

describe('#writeStateFile()', () => {
  let oldCwd
  let tmpDirPath
  let stateFilePath

  const fileContent = {
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
    oldCwd = process.cwd()
    process.chdir(tmpDirPath)
  })

  afterEach(() => {
    process.chdir(oldCwd)
  })

  it('should write the content to disk', async () => {
    await writeStateFile(fileContent)
    const stateFileContent = await fse.readJsonAsync(stateFilePath)
    const properties = keys(stateFileContent)
    expect(properties.length).toEqual(3)
    expect(stateFileContent).toHaveProperty('serviceId')
    expect(stateFileContent).toHaveProperty('myApp:myFunction', {
      type: 'aws-iam-function',
      internallyManaged: false,
      state: {
        name: 'my-function',
        memorySize: 512,
        timeout: 60
      }
    })
    expect(stateFileContent).toHaveProperty('myApp:myRole', {
      type: 'aws-iam-role',
      internallyManaged: false,
      state: {
        name: 'my-role',
        service: 'some.serverless.service'
      }
    })
  })

  it('should generate and save a serviceId if the file content does not contain such', async () => {
    await writeStateFile(fileContent)
    const stateFileContent = await fse.readJsonAsync(stateFilePath)
    expect(stateFileContent).toHaveProperty('serviceId')
    expect(stateFileContent.serviceId.length).not.toEqual(0)
  })

  it('should not re-generate a serviceId if the file already contains such', async () => {
    const serviceId = 'AsH3gefdfDSY'
    const modifiedFileContent = assoc('serviceId', serviceId, fileContent)

    await writeStateFile(modifiedFileContent)
    const stateFileContent = await fse.readJsonAsync(stateFilePath)
    expect(stateFileContent).toHaveProperty('serviceId')
    expect(stateFileContent.serviceId).toEqual(modifiedFileContent.serviceId)
  })
})
