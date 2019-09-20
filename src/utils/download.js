const os = require('os')
const path = require('path')
const { ensureDir, remove } = require('fs-extra')
const packageJson = require('package-json')
const semver = require('semver')
// const BbPromise = require('bluebird')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const dirExists = require('./fs/dirExists')

async function getComponentVersionToDownload(component) {
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

async function download(componentsToDownload) {
  if (!componentsToDownload.length) {
    return {}
  }

  const localRegistryPath = path.join(os.homedir(), '.serverless', 'components', 'registry', 'npm')
  await ensureDir(localRegistryPath)

  const componentsPathsMap = {}

  const promises = componentsToDownload.map(async (component) => {
    let componentVersionToInstall
    try {
      componentVersionToInstall = await getComponentVersionToDownload(component)
    } catch (e) {
      /*
       * In case the requested component is not found in the registry, try resolving the component locally.
       * This is needed in case of:
       * - a local component package that is not published to the registry (often found in a monorepo; a package can also be set to `private` and will never be published)
       * - a component path was given as an absolute path, eg: /Users/username/some/folder/my-component
       */
      try {
        require.resolve(component)
        componentsPathsMap[component] = component
        return
      } catch (re) {
        throw Error(
          `Component "${component}" was not found on NPM nor could it be resolved locally.`
        )
      }
    }

    const npmInstallPath = path.join(localRegistryPath, componentVersionToInstall.pair)
    const requirePath = path.join(npmInstallPath, 'node_modules', componentVersionToInstall.name)
    const exactVersion = componentVersionToInstall.pair

    // todo - Eslam
    // for now we are auto checking for updates for all components in the local cache
    // this ensures if there's a bug fix for one of the component dependencies
    // the user will be able to get it without having to nuke their local cache (or even know about it)
    // however, this adds couple of seconds to the deployment speed and might not be optimal in the long term
    // let's test it for a while, if we find that it's too slow, we could make it manually triggered
    // with a --update / -u flag. In that case, just edit the following line :)
    // const shouldUpdate = true || process.argv.find((arg) => arg === '--update' || arg === '-u')
    const shouldUpdate = false

    if (!(await dirExists(requirePath))) {
      try {
        await exec(`npm install ${exactVersion} --prefix ${npmInstallPath}`)
      } catch (e) {
        await remove(npmInstallPath)
        throw e
      }
    } else if (shouldUpdate) {
      await exec(`npm update`, { cwd: requirePath })
    }

    componentsPathsMap[component] = requirePath
  })

  await Promise.all(promises)

  return componentsPathsMap
}

module.exports = download
