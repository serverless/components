const path = require('path')
const packageComponent = require('./packageComponent')
const pack = require('../pack')
const fs = require('../fs')

jest.mock('../pack')
pack.mockImplementation(() => Promise.resolve())

jest.mock('../fs', () => ({
  fileExists: jest.fn().mockReturnValue(Promise.resolve(true)),
  readFile: jest.fn().mockReturnValue(Promise.resolve({ type: 'my-project', version: '0.0.1' }))
}))

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#packageComponent', () => {
  it('should package component', async () => {
    const options = {
      path: './',
      format: 'zip'
    }

    await packageComponent(options)
    const slsYmlFilePath = path.join(process.cwd(), 'serverless.yml')
    const outputFilePath = path.resolve(options.path, 'my-project@0.0.1.zip')
    expect(pack).toBeCalledWith(process.cwd(), outputFilePath)
    expect(fs.fileExists).toBeCalledWith(slsYmlFilePath)
    expect(fs.readFile).toBeCalledWith(slsYmlFilePath)
  })

  it('validate output path', async () => {
    const options = {
      format: 'zip'
    }
    let err
    try {
      await packageComponent(options)
    } catch (e) {
      err = e
    }
    expect(err.message).toEqual('Please provide an output path for the package with the --path option')
  })
})
