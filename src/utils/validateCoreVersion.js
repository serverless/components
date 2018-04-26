const semver = require('semver')
const coreVersion = require('../../package.json').version

module.exports = (componentType, componentCoreVersion) => {
  if (componentCoreVersion && !semver.satisfies(coreVersion, componentCoreVersion)) {
    throw new Error(`The Serverless Components core is incompatible with component ${componentType}`)
  }
  return true
}
