const os = require('os')
const path = require('path')
const { ensureDir, remove } = require('fs-extra')
const packageJson = require('package-json')
const semver = require('semver')
const BbPromise = require('bluebird')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const dirExists = require('../../../utils/fs/dirExists')

const getComponentVersionToInstall = async (component) => {
  let packageName
  let specifiedVersion
  if (component.startsWith('@')) {
    // scoped package
    const arr = component.split('@')

    if (arr.length === 2) {
      // no version specified
      packageName = component
      specifiedVersion = undefined
    } else if (arr.length === 3) {
      packageName = `@${arr[1]}`
      specifiedVersion = arr[2]
    } else {
      throw Error(`${component} is not a valid npm query`)
    }
  } else {
    const arr = component.split('@')

    if (arr.length === 1) {
      packageName = component
      specifiedVersion = undefined
    } else if (arr.length === 2) {
      packageName = arr[0]
      specifiedVersion = arr[1]
    } else {
      throw Error(`${component} is not a valid npm query`)
    }
  }

  const packageData = await packageJson(packageName, { allVersions: true })

  const latestVersion = packageData['dist-tags'].latest
  const publishedVersions = Object.keys(packageData.versions)

  if (!specifiedVersion || specifiedVersion === 'latest') {
    specifiedVersion = latestVersion
  }

  const versionToInstall = semver.maxSatisfying(publishedVersions, specifiedVersion)

  if (!versionToInstall) {
    throw Error(`component version that satisfies the query ${component} was not found`)
  }

  return {
    name: packageName,
    version: versionToInstall,
    pair: `${packageName}@${versionToInstall}`
  }
}

/*
 * takes an array of versioned components to install
 * inputs example: ['@serverless/aws-lambda', '@serverless/chat-app@0.1.0', '@serverless/socket@^0.1.0']
 * output example: { '@serverless/aws-lambda': 'local/path/to/component', ...etc }
 *
 */

const installComponents = async (componentsToInstall) => {
  const localRegistryPath = path.join(os.homedir(), '.serverless', 'components', 'registry', 'npm')
  await ensureDir(localRegistryPath)

  const componentsPathsMap = {}

  await BbPromise.map(componentsToInstall, async (component) => {
    const componentVersionToInstall = await getComponentVersionToInstall(component)

    const npmInstallPath = path.join(localRegistryPath, componentVersionToInstall.pair)
    const requirePath = path.join(npmInstallPath, 'node_modules', componentVersionToInstall.name)
    const exactVersion = componentVersionToInstall.pair

    if (!(await dirExists(requirePath))) {
      try {
        await exec(`npm install ${exactVersion} --prefix ${npmInstallPath}`)
      } catch (e) {
        await remove(npmInstallPath)
        throw e
      }
    }

    componentsPathsMap[component] = requirePath
  })

  return componentsPathsMap
}

module.exports = installComponents
