const getServerlessrcPath = require('./getServerlessrcPath')
const createConfig = require('./createConfig')
const fileExists = require('../fs/fileExists')

module.exports = async () => {
  if (!await fileExists(getServerlessrcPath())) {
    createConfig()
  }
  return require('rc')('serverless') // eslint-disable-line
}
