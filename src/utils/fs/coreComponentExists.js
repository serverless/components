const path = require('path')
const fileExists = require('./fileExists')

const coreComponentExists = async (coreComponentName) => {
  const coreComponentsRoot = path.resolve(__dirname, '../../../components')
  const coreComponentPath = path.join(coreComponentsRoot, coreComponentName, 'serverless.js')

  return fileExists(coreComponentPath)
}

module.exports = coreComponentExists
