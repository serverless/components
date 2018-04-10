const path = require('path')
const getRegistryRoot = require('../getRegistryRoot')
const getComponentType = require('./getComponentType')

describe('#getComponentType()', () => {
  it('should retain the path information if it is not loaded from the registry', () => {
    const componentRootPath = './my-custom-component'
    const res = getComponentType(componentRootPath)
    expect(res).toEqual(componentRootPath)
  })

  it('should return only the component "type" if it is loaded from the registry', () => {
    const componentRootPath = path.join(getRegistryRoot(), 'my-function')
    const res = getComponentType(componentRootPath)
    expect(res).toEqual('my-function')
  })
})
