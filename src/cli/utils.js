const path = require('path')
const fse = require('fs-extra')
const YAML = require('js-yaml')
const traverse = require('traverse')
const dotenv = require('dotenv')
const {
  readConfigFile,
  writeConfigFile,
  createAccessKeyForTenant
} = require('@serverless/platform-sdk')
const R = require('ramda') // eslint-disable-line

const fileExistsSync = (filePath) => {
  try {
    const stats = fse.lstatSync(filePath)
    return stats.isFile()
  } catch (e) {
    return false
  }
}

const getCredentials = () => {
  // Load env vars
  let envVars = {}
  const defaultEnvFilePath = path.join(process.cwd(), `.env`)
  const stageEnvFilePath = path.join(process.cwd(), `.env.dev`) // todo remove this

  // Load environment variables via .env file
  if (fileExistsSync(stageEnvFilePath)) {
    envVars = dotenv.config({ path: path.resolve(stageEnvFilePath) }).parsed || {}
  } else if (fileExistsSync(defaultEnvFilePath)) {
    envVars = dotenv.config({ path: path.resolve(defaultEnvFilePath) }).parsed || {}
  }

  // Known Provider Environment Variables and their SDK configuration properties
  const providers = {}

  // AWS
  providers.aws = {}
  providers.aws.AWS_ACCESS_KEY_ID = 'accessKeyId'
  providers.aws.AWS_SECRET_ACCESS_KEY = 'secretAccessKey'
  providers.aws.AWS_REGION = 'region'

  // Google
  providers.google = {}
  providers.google.GOOGLE_APPLICATION_CREDENTIALS = 'applicationCredentials'
  providers.google.GOOGLE_PROJECT_ID = 'projectId'
  providers.google.GOOGLE_CLIENT_EMAIL = 'clientEmail'
  providers.google.GOOGLE_PRIVATE_KEY = 'privateKey'

  // Tencent
  providers.tencent = {}
  providers.tencent.TENCENT_APP_ID = 'AppId'
  providers.tencent.TENCENT_SECRET_ID = 'SecretId'
  providers.tencent.TENCENT_SECRET_KEY = 'SecretKey'

  // Docker
  providers.docker = {}
  providers.docker.DOCKER_USERNAME = 'username'
  providers.docker.DOCKER_PASSWORD = 'password'

  const credentials = {}

  for (const provider in providers) {
    const providerEnvVars = providers[provider]
    for (const providerEnvVar in providerEnvVars) {
      if (!credentials[provider]) {
        credentials[provider] = {}
      }
      // Proper environment variables override what's in the .env file
      if (process.env.hasOwnProperty(providerEnvVar)) {
        credentials[provider][providerEnvVars[providerEnvVar]] = process.env[providerEnvVar]
      } else if (envVars.hasOwnProperty(providerEnvVar)) {
        credentials[provider][providerEnvVars[providerEnvVar]] = envVars[providerEnvVar]
      }
      continue
    }
  }

  return credentials
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

/**
 * Resolves any variables that require resolving before the engine.
 * This currently supports only ${env}.  All others should be resolved within the deployment engine.
 *
 * @param {*} config
 */
const resolveConfig = (config) => {
  const regex = /\${(\w*:?[\w\d.-]+)}/g
  let variableResolved = false
  const resolvedConfig = traverse(config).forEach(function(value) {
    const matches = typeof value === 'string' ? value.match(regex) : null
    if (matches) {
      let newValue = value
      for (const match of matches) {
        const referencedPropertyPath = match.substring(2, match.length - 1).split('.')
        // Search for ${env:}
        if (/\${env\.(\w*:?[\w\d.-]+)}/g.test(match)) {
          newValue = process.env[referencedPropertyPath[1]]
          variableResolved = true
        }
      }
      this.update(newValue)
    }
  })
  if (variableResolved) {
    return resolveConfig(resolvedConfig)
  }
  return resolvedConfig
}

/*
 * gets or creates an access key based on org
 */
const getOrCreateAccessKey = async (org) => {
  if (process.env.SERVERLESS_ACCESS_KEY) {
    return process.env.SERVERLESS_ACCESS_KEY
  }

  // read config file from the user machine
  const userConfigFile = readConfigFile()

  // Verify config file
  if (!userConfigFile || !userConfigFile.users || !userConfigFile.users[userConfigFile.userId]) {
    return null
  }

  const user = userConfigFile.users[userConfigFile.userId]

  if (!user.dashboard.accessKeys[org]) {
    // create access key and save it
    const accessKey = await createAccessKeyForTenant(org)
    userConfigFile.users[userConfigFile.userId].dashboard.accessKeys[org] = accessKey
    writeConfigFile(userConfigFile)
    return accessKey
  }

  // return the access key for the specified org
  return user.dashboard.accessKeys[org]
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
  getOrCreateAccessKey,
  getCredentials,
  getConfig,
  resolveConfig,
  isComponentsProject,
  fileExistsSync,
  runningComponents
}
