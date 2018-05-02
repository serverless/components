const path = require('path')
const { fse } = require('./fs')
const getRegistryRoot = require('./getRegistryRoot')

const getRegistryComponentsRoots = async () => (await fse.readdirAsync(getRegistryRoot()))
  .filter(async (f) => (await fse.statAsync(path.join(getRegistryRoot(), f))).isDirectory())
  .map((dirName) => path.join(getRegistryRoot(), dirName))

module.exports = getRegistryComponentsRoots
