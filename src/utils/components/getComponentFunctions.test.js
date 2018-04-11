const path = require('path')
const BbPromise = require('bluebird')
const fse = require('fs-extra')
const getComponentFunctions = require('./getComponentFunctions')
const getTmpDir = require('../fs/getTmpDir')
const getRegistryRoot = require('../getRegistryRoot')

const fsp = BbPromise.promisifyAll(fse)

jest.mock('../getRegistryRoot')

describe('#getComponentFunctions()', () => {
  let oldCwd
  let registryPath
  let cwdPath

  beforeEach(async () => {
    jest.resetAllMocks()
    oldCwd = process.cwd()
    registryPath = await getTmpDir()
    cwdPath = await getTmpDir()
    process.chdir(cwdPath)
    // a component located at the registry
    getRegistryRoot.mockImplementation(() => registryPath)
    const myRegistryComponentPath = path.join(registryPath, 'my-component')
    const myRegistryComponentFilePath = path.join(myRegistryComponentPath, 'index.js')
    await fsp.ensureDirAsync(myRegistryComponentPath)
    await fsp.writeFileAsync(myRegistryComponentFilePath, 'module.exports = { deploy: () => {} }')
    // a component located at the cwd
    const myCwdComponentPath = cwdPath
    const myCwdComponentFilePath = path.join(myCwdComponentPath, 'index.js')
    await fsp.ensureDirAsync(myCwdComponentPath)
    await fsp.writeFileAsync(myCwdComponentFilePath, 'module.exports = { deploy: () => {} }')
  })

  afterEach(() => {
    process.chdir(oldCwd)
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should load and return the components function for components in the cwd', () => {
    const type = cwdPath.split(path.sep).pop()
    const res = getComponentFunctions(type)
    expect(res).toHaveProperty('deploy')
  })

  it('should load and return the components functions for registry components', () => {
    const res = getComponentFunctions('my-component')
    expect(res).toHaveProperty('deploy')
  })

  it('should return an empty object if component functions could not be found', () => {
    const res = getComponentFunctions('my-functions-less-component')
    expect(res).toEqual({})
  })
})
