/*
 * Serverless Components: Utilities
 */

const args = require('minimist')(process.argv.slice(2))
const {
  readConfigFile,
  writeConfigFile,
  createAccessKeyForTenant,
  refreshToken,
  listTenants
} = require('@serverless/platform-sdk')
const { loadInstanceConfig, resolveInputVariables } = require('../utils')

const getDefaultOrgName = async () => {
  const res = readConfigFile()

  if (!res.userId) {
    return null
  }

  let { defaultOrgName } = res.users[res.userId].dashboard

  // if defaultOrgName is not in RC file, fetch it from the platform
  if (!defaultOrgName) {
    await refreshToken()

    const userConfigFile = readConfigFile()

    const { username, dashboard } = userConfigFile.users[userConfigFile.userId]
    const { idToken } = dashboard
    const orgsList = await listTenants({ username, idToken })

    // filter by owner
    const filteredOrgsList = orgsList.filter((org) => org.role === 'owner')

    defaultOrgName = filteredOrgsList[0].orgName

    res.users[res.userId].dashboard.defaultOrgName = defaultOrgName

    writeConfigFile(res)
  }

  return defaultOrgName
}

/**
 * Load credentials from a ".env" or ".env.[stage]" file
 * @param {*} stage
 */

const loadInstanceCredentials = () => {
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

  // Kubernetes
  providers.kubernetes = {}
  providers.kubernetes.KUBERNETES_ENDPOINT = 'endpoint'
  providers.kubernetes.KUBERNETES_PORT = 'port'
  providers.kubernetes.KUBERNETES_SERVICE_ACCOUNT_TOKEN = 'serviceAccountToken'
  providers.kubernetes.KUBERNETES_SKIP_TLS_VERIFY = 'skipTlsVerify'

  // Docker
  providers.docker = {}
  providers.docker.DOCKER_USERNAME = 'username'
  providers.docker.DOCKER_PASSWORD = 'password'
  providers.docker.DOCKER_AUTH = 'auth'

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
      }
      continue
    }
  }

  return credentials
}

/**
 * Reads a serverless instance config file in a given directory path
 * @param {*} directoryPath
 */
const loadVendorInstanceConfig = async (directoryPath) => {
  const instanceFile = loadInstanceConfig(directoryPath)

  if (!instanceFile) {
    throw new Error(`serverless config file was not found`)
  }

  if (!instanceFile.name) {
    throw new Error(`Missing "name" property in serverless.yml`)
  }

  if (!instanceFile.component) {
    throw new Error(`Missing "component" property in serverless.yml`)
  }

  // if stage flag provided, overwrite
  if (args.stage) {
    instanceFile.stage = args.stage
  }

  // if org flag provided, overwrite
  if (args.org) {
    instanceFile.org = args.org
  }

  if (!instanceFile.org) {
    instanceFile.org = await getDefaultOrgName()
  }

  if (!instanceFile.org) {
    throw new Error(`Missing "org" property in serverless.yml`)
  }

  // if app flag provided, overwrite
  if (args.app) {
    instanceFile.app = args.app
  }

  if (instanceFile.inputs) {
    // load credentials to process .env files before resolving env variables
    await loadInstanceCredentials(instanceFile.stage)
    instanceFile.inputs = resolveInputVariables(instanceFile.inputs)
  }

  return instanceFile
}

/**
 * Check whether the user is logged in
 */
const isLoggedIn = () => {
  const userConfigFile = readConfigFile()
  // If userId is null, they are not logged in.  They also might be a new user.
  if (!userConfigFile.userId) {
    return false
  }
  if (!userConfigFile.users[userConfigFile.userId]) {
    return false
  }
  return true
}

/**
 * Gets the logged in user's token id, or access key if its in env
 */
const getAccessKey = async () => {
  // if access key in env, use that for CI/CD
  if (process.env.SERVERLESS_ACCESS_KEY) {
    return process.env.SERVERLESS_ACCESS_KEY
  }

  if (!isLoggedIn()) {
    return null
  }

  // refresh token if it's expired.
  // this platform-sdk method returns immediately if the idToken did not expire
  // if it did expire, it'll refresh it and update the config file
  await refreshToken()

  // read config file from user machine
  const userConfigFile = readConfigFile()

  // Verify config file and that the user is logged in
  if (!userConfigFile || !userConfigFile.users || !userConfigFile.users[userConfigFile.userId]) {
    return null
  }

  const user = userConfigFile.users[userConfigFile.userId]

  return user.dashboard.idToken
}

/**
 * Gets or creates an access key based on org
 * @param {*} org
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
  // return user.dashboard.accessKeys[org]
  return user.dashboard.idToken
}

module.exports = {
  loadInstanceConfig: loadVendorInstanceConfig,
  loadInstanceCredentials,
  getOrCreateAccessKey,
  getAccessKey,
  isLoggedIn,
  getDefaultOrgName
}
