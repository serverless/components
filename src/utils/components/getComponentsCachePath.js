const os = require('os')
const path = require('path')
const BbPromise = require('bluebird')
const fse = BbPromise.promisifyAll(require('fs-extra'))

module.exports = async () => {
  const componentsCachePath = path.join(os.homedir(), '.serverless', 'components', 'cache')
  await fse.ensureDirAsync(componentsCachePath)
  return componentsCachePath
}
