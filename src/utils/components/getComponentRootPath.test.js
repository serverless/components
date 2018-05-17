const { getTmpDir } = require('@serverless/utils')
const path = require('path')
const getRegistryRoot = require('../registry/getRegistryRoot')
const getComponentRootPath = require('./getComponentRootPath')

describe('#getComponentRootPath()', () => {
  it('should return a registry path if "type" parameter does not include path information', async () => {
    const type = 'function-mock'
    const res = await getComponentRootPath(type)
    const expected = path.join(getRegistryRoot(), type)
    expect(res).toEqual(expected)
  })

  it('should detect if "type" parameter includes path to local file system', async () => {
    const type = './my-custom-component'
    const res = await getComponentRootPath(type)
    const expected = path.resolve(type)
    expect(res).toEqual(expected)
  })
})
