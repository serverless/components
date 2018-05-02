const path = require('path')
const BbPromise = require('bluebird')
const fse = BbPromise.promisifyAll(require('fs-extra'))
const getRegistryRoot = require('./getRegistryRoot')

const getRegistryComponentsRoots = async () => (await fse.readdirAsync(getRegistryRoot()))
  .filter(async (f) => (await fse.statAsync(path.join(getRegistryRoot(), f))).isDirectory())
  .map((dirName) => path.join(getRegistryRoot(), dirName))

module.exports = getRegistryComponentsRoots
