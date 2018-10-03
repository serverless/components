import semver from 'semver'
import packageData from '../../../package.json'

const validateCoreVersion = (componentType, componentCoreVersion) => {
  if (componentCoreVersion && !semver.satisfies(packageData.version, componentCoreVersion)) {
    throw new Error(
      `The Serverless Components core is incompatible with component ${componentType}`
    )
  }
  return true
}

export default validateCoreVersion
