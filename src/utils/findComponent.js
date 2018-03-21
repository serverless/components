const path = require('path')
const getConfig = require('./config/getConfig')
const fs = require('fs')

module.exports = (type) => {
  const config = getConfig()
  const componentDirectories = [ path.join(__dirname, '../../registry') ]
  if (config.componentDirectories) {
    componentDirectories.push(...config.componentDirectories)
  }
  const location = componentDirectories
    .map((dir) => path.join(dir, type))
    .find((dir) => fs.existsSync(dir))
  if (!location) {
    throw new Error(`The component type '${type}' was not found in any available location.`)
  }
  return location
}
