const path = require('path')
const getRegistryRoot = require('./getRegistryRoot')
const getRegistryComponentsRoots = require('./getRegistryComponentsRoots')

describe('getRegistryComponentsRoots', () => {
  it('should return a list of all registry components roots', async () => {
    const expectedComponentRoot = path.resolve(getRegistryRoot(), 'aws-lambda')
    const componentsRoots = await getRegistryComponentsRoots()
    expect(componentsRoots).toContain(expectedComponentRoot)
  })
})
