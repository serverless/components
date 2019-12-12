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
const { merge, endsWith } = require('ramda')

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
      if (!envVars.hasOwnProperty(providerEnvVar)) {
        continue
      }
      if (!credentials[provider]) {
        credentials[provider] = {}
      }
      credentials[provider][providerEnvVars[providerEnvVar]] = envVars[providerEnvVar]
    }
  }

  return credentials
}

const isYamlPath = (filePath) => endsWith('.yml', filePath) || endsWith('.yaml', filePath)

const isJsonPath = (filePath) => endsWith('.json', filePath)

const parseFile = (filePath, contents, options = {}) => {
  if (isJsonPath(filePath)) {
    return JSON.parse(contents)
  } else if (isYamlPath(filePath)) {
    return YAML.load(contents.toString(), merge(options, { filename: filePath }))
  } else if (filePath.endsWith('.slsignore')) {
    return contents.toString().split('\n')
  }
  return contents.toString().trim()
}

const readFileSync = (filePath, options = {}) => {
  const contents = fse.readFileSync(filePath, 'utf8')
  return parseFile(filePath, contents, options)
}

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

const resolveConfig = (config) => {
  const regex = /\${(\w*:?[\w\d.-]+)}/g
  let variableResolved = false
  const resolvedConfig = traverse(config).forEach(function(value) {
    const matches = typeof value === 'string' ? value.match(regex) : null
    if (matches) {
      let newValue = value
      for (const match of matches) {
        const referencedPropertyPath = match.substring(2, match.length - 1).split('.')
        const referencedTopLevelProperty = referencedPropertyPath[0]
        if (/\${env\.(\w*:?[\w\d.-]+)}/g.test(match)) {
          newValue = process.env[referencedPropertyPath[1]]
          variableResolved = true
        } else {
          if (!config[referencedTopLevelProperty]) {
            throw Error(`invalid reference ${match}`)
          }

          if (!config[referencedTopLevelProperty].component) {
            variableResolved = true
            const referencedPropertyValue = path(referencedPropertyPath, config)

            if (referencedPropertyValue === undefined) {
              throw Error(`invalid reference ${match}`)
            }

            if (match === value) {
              newValue = referencedPropertyValue
            } else if (typeof referencedPropertyValue === 'string') {
              newValue = newValue.replace(match, referencedPropertyValue)
            } else {
              throw Error(`the referenced substring is not a string`)
            }
          }
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

const isComponentsProject = () => {
  const serverlessComponentFile = getConfig('serverless.component')
  const serverlessFile = getConfig('serverless')

  if (serverlessComponentFile || (serverlessFile && !serverlessFile.provider)) {
    return true
  }

  return false
}

// Gets or creates an access key based on org
const getOrCreateAccessKey = async (org) => {
  if (process.env.SERVERLESS_ACCESS_KEY) {
    return process.env.SERVERLESS_ACCESS_KEY
  }

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

  return user.dashboard.accessKeys[org]
}

module.exports = {
  getOrCreateAccessKey,
  getCredentials,
  getConfig,
  resolveConfig,
  isComponentsProject,
  fileExistsSync
}
