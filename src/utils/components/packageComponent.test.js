const utils = require('@serverless/utils')
const path = require('path')
const packageComponent = require('./packageComponent')

jest.mock('@serverless/utils', () => ({
  fileExists: jest.fn().mockReturnValue(Promise.resolve(true)),
  packDir: jest.fn().mockReturnValue(Promise.resolve()),
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
    expect(utils.packDir).toBeCalledWith(process.cwd(), outputFilePath)
    expect(utils.fileExists).toBeCalledWith(slsYmlFilePath)
    expect(utils.readFile).toBeCalledWith(slsYmlFilePath)
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
