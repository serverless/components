const utils = require('@serverless/utils')
const path = require('path')
const packageComponent = require('./packageComponent')
const pack = require('../pack')

jest.mock('../pack')

jest.mock('@serverless/utils', () => ({
  fileExists: jest.fn().mockReturnValue(Promise.resolve(true)),
  readFile: jest
    .fn()
    .mockReturnValue(Promise.resolve({ type: 'my-project', version: '0.0.1' }))
}))

afterEach(() => {
  jest.restoreAllMocks()
})

describe('#packageComponent', () => {
  it('should package component at given realtive path', async () => {
    pack.mockImplementation(() => Promise.resolve())
    utils.fileExists.mockReturnValue(Promise.resolve(true))
    utils.readFile.mockReturnValue(Promise.resolve({ type: 'my-project', version: '0.0.1' }))

    const options = {
      path: './some-path',
      format: 'zip'
    }

    await packageComponent(options)
    const componentPath = path.resolve(process.cwd(), './some-path')
    const slsYmlFilePath = path.join(componentPath, 'serverless.yml')
    const outputFilePath = path.resolve(componentPath, 'my-project@0.0.1.zip')
    expect(pack).toBeCalledWith(componentPath, outputFilePath)
    expect(utils.fileExists).toBeCalledWith(slsYmlFilePath)
    expect(utils.readFile).toBeCalledWith(slsYmlFilePath)
  })

  it('should package component at given absolute path', async () => {
    pack.mockImplementation(() => Promise.resolve())
    utils.fileExists.mockReturnValue(Promise.resolve(true))
    utils.readFile.mockReturnValue(Promise.resolve({ type: 'my-project', version: '0.0.1' }))

    const options = {
      path: '/home/some-path',
      format: 'zip'
    }

    await packageComponent(options)
    const componentPath = '/home/some-path'
    const slsYmlFilePath = path.join(componentPath, 'serverless.yml')
    const outputFilePath = path.resolve(componentPath, 'my-project@0.0.1.zip')
    expect(pack).toBeCalledWith(componentPath, outputFilePath)
    expect(utils.fileExists).toBeCalledWith(slsYmlFilePath)
    expect(utils.readFile).toBeCalledWith(slsYmlFilePath)
  })

  it('validate package path', async () => {
    pack.mockImplementation(() => Promise.resolve())
    utils.fileExists.mockReturnValue(Promise.resolve(false))

    const componentPath = '/home/some-path'
    const options = {
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
