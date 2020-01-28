const path = require('path')
const fse = require('fs-extra')
const YAML = require('js-yaml')
const R = require('ramda') // eslint-disable-line

const fileExistsSync = (filePath) => {
  try {
    const stats = fse.lstatSync(filePath)
    return stats.isFile()
  } catch (e) {
    return false
  }
}

const isYamlPath = (filePath) => R.endsWith('.yml', filePath) || R.endsWith('.yaml', filePath)

const isJsonPath = (filePath) => R.endsWith('.json', filePath)

const parseFile = (filePath, contents, options = {}) => {
  if (isJsonPath(filePath)) {
    return JSON.parse(contents)
  } else if (isYamlPath(filePath)) {
    return YAML.load(contents.toString(), R.merge(options, { filename: filePath }))
  } else if (filePath.R.endsWith('.slsignore')) {
    return contents.toString().split('\n')
  }
  return contents.toString().trim()
}

const readFileSync = (filePath, options = {}) => {
  const contents = fse.readFileSync(filePath, 'utf8')
  return parseFile(filePath, contents, options)
}

/*
 * reads a serverless config file based on the file name relative to the cwd.
 * whether that file is serverless.yml or serverless.component.yml
 */
const getConfig = (fileName) => {
  const ymlFilePath = path.join(process.cwd(), `${fileName}.yml`)
  const yamlFilePath = path.join(process.cwd(), `${fileName}.yaml`)
  const jsonFilePath = path.join(process.cwd(), `${fileName}.json`)

  try {
    if (fileExistsSync(ymlFilePath)) {
      return readFileSync(ymlFilePath)
    }
    if (fileExistsSync(yamlFilePath)) {
      return readFileSync(yamlFilePath)
    }
  } catch (e) {
    // todo currently our YAML parser does not support
    // CF schema (!Ref for example). So we silent that error
    // because the framework can deal with that
    if (e.name !== 'YAMLException') {
      throw e
    }
    return false
  }

  if (fileExistsSync(jsonFilePath)) {
    return readFileSync(jsonFilePath)
  }

  return false
}

/*
 * checks whether the provided serverless.yml file object is a component file
 */
const isComponentsFile = (serverlessFile) => {
  if (typeof serverlessFile !== 'object') {
    return false
  }

  // make sure it's NOT a framework file
  if (serverlessFile.provider && serverlessFile.provider.name) {
    return false
  }

  // make sure it IS a components file
  if (serverlessFile.component) {
    return true
  }

  return false
}

/*
 * checks whether the cwd is a component project based on the yaml file that exists
 * used by the framework v1 to determine whether to load v1 or components
 */
const runningComponents = () => {
  const serverlessFile = getConfig('serverless')
  const serverlessComponentFile = getConfig('serverless.component')

  if (serverlessComponentFile || isComponentsFile(serverlessFile)) {
    return true
  }

  return false
}

/*
 * checks whether the cwd is a component project based on the yaml file that exists
 * used by the framework v1 to determine whether to load v1 or components
 */
// TODO this is probably a duplicate of the runningComponents function above
const isComponentsProject = () => {
  const serverlessComponentFile = getConfig('serverless.component')
  const serverlessFile = getConfig('serverless')

  if (serverlessComponentFile || (serverlessFile && !serverlessFile.provider)) {
    return true
  }

  return false
}

module.exports = {
  runningComponents
}