const fsExtra = require('fs-extra')
const getServerlessrcPath = require('./getServerlessrcPath')
const createConfig = require('./createConfig')

module.exports = () => {
  if (!fsExtra.existsSync(getServerlessrcPath())) {
    createConfig()
  }
  return require('rc')('serverless') // eslint-disable-line
}
