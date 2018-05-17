const utils = require('@serverless/utils')
const path = require('path')
const packageComponent = require('./packageComponent')

jest.mock('@serverless/utils', () => ({
  fileExists: jest.fn(),
  packDir: jest.fn(),
  readFile: jest.fn()
}))

afterEach(() => {
  jest.restoreAllMocks()
})

describe('#packageComponent', () => {
  it('should package component at given realtive path', async () => {
    utils.packDir.mockImplementation(() => Promise.resolve())
    utils.fileExists.mockReturnValue(Promise.resolve(true))
    utils.readFile.mockReturnValue(Promise.resolve({ type: 'my-project', version: '0.0.1' }))

    const options = {
      projectPath: process.cwd(),
      path: './some-path',
      format: 'zip'
    }

    await packageComponent(options)
    const componentPath = path.join(process.cwd(), 'some-path')
    const slsYmlFilePath = path.join(componentPath, 'serverless.yml')
    const outputFilePath = path.resolve(componentPath, 'my-project@0.0.1.zip')
    expect(utils.packDir).toBeCalledWith(componentPath, outputFilePath)
    expect(utils.fileExists).toBeCalledWith(slsYmlFilePath)
    expect(utils.readFile).toBeCalledWith(slsYmlFilePath)
  })

  it('should package component at given absolute path', async () => {
    utils.packDir.mockImplementation(() => Promise.resolve())
    utils.fileExists.mockReturnValue(Promise.resolve(true))
    utils.readFile.mockReturnValue(Promise.resolve({ type: 'my-project', version: '0.0.1' }))

    const options = {
      projectPath: process.cwd(),
      path: '/home/some-path',
      format: 'zip'
    }

    await packageComponent(options)
    const componentPath = '/home/some-path'
    const slsYmlFilePath = path.join(componentPath, 'serverless.yml')
    const outputFilePath = path.resolve(componentPath, 'my-project@0.0.1.zip')
    expect(utils.packDir).toBeCalledWith(componentPath, outputFilePath)
    expect(utils.fileExists).toBeCalledWith(slsYmlFilePath)
    expect(utils.readFile).toBeCalledWith(slsYmlFilePath)
  })

  it('validate package path', async () => {
    utils.packDir.mockImplementation(() => Promise.resolve())
    utils.fileExists.mockReturnValue(Promise.resolve(false))

    const componentPath = '/home/some-path'
    const options = {
      projectPath: process.cwd(),
      path: componentPath,
      format: 'zip'
    }
    let err
    try {
      await packageComponent(options)
    } catch (e) {
      err = e
    }
    expect(err.message).toEqual(`Could not find a serverless.yml file in ${componentPath}`)
  })
})
