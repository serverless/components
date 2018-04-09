const path = require('path')
const BbPromise = require('bluebird')
const fse = require('fs-extra')
const getComponentFunctions = require('./getComponentFunctions')
const getTmpDir = require('../fs/getTmpDir')
const getRegistryRoot = require('../getRegistryRoot')

const fsp = BbPromise.promisifyAll(fse)

jest.mock('../getRegistryRoot')

describe('#getComponentFunctions()', () => {
  let tmpDirPath

  beforeEach(async () => {
    jest.resetAllMocks()
    tmpDirPath = await getTmpDir()
    getRegistryRoot.mockImplementation(() => tmpDirPath)
    const myComponentPath = path.join(tmpDirPath, 'my-component')
    const myComponentFilePath = path.join(myComponentPath, 'index.js')
    await fsp.ensureDirAsync(myComponentPath)
    await fsp.writeFileAsync(myComponentFilePath, 'module.exports = { deploy: () => {} }')
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should return the components functions', () => {
    const res = getComponentFunctions('my-component')
    expect(res).toHaveProperty('deploy')
  })

  it('should return an empty object if component functions could not be found', () => {
    const res = getComponentFunctions('my-functions-less-component')
    expect(res).toEqual({})
  })
})
