const os = require('os')
const path = require('path')
const { fse } = require('../fs')

module.exports = async () => {
  const componentsCachePath = path.join(os.homedir(), '.serverless', 'components', 'cache')
  await fse.ensureDirAsync(componentsCachePath)
  return componentsCachePath
}
