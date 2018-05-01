const semver = require('semver')
const coreVersion = require('../../../package.json').version

const validateCoreVersion = (componentType, componentCoreVersion) => {
  if (componentCoreVersion && !semver.satisfies(coreVersion, componentCoreVersion)) {
    throw new Error(`The Serverless Components core is incompatible with component ${componentType}`)
  }
  return true
}

module.exports = validateCoreVersion
