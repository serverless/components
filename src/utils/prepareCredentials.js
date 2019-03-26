/**
 * Identifies environment variables that are known vendor credentials and finds their corresponding SDK configuration properties
 * @param {Object} envVars - Shallow object representing environment variables
 */

const prepareCredentials = (envVars) => {
  const credentials = {}

  for (const provider in providers) {
    const providerEnvVars = providers[provider]
    for (const providerEnvVar in providerEnvVars) {
      if (!envVars.hasOwnProperty(providerEnvVar)) continue
      if (!credentials[provider]) credentials[provider] = {}
      credentials[provider][providerEnvVars[providerEnvVar]] = envVars[providerEnvVar]
    }
  }

  return credentials
}

// Known Provider Environment Variables and their SDK configuration properties
const providers = {}

// AWS
providers.aws = {}
providers.aws.AWS_ACCESS_KEY_ID = 'accessKeyId'
providers.aws.AWS_SECRET_ACCESS_KEY = 'secretAccessKey'
providers.aws.AWS_REGION = 'region'

module.exports = prepareCredentials
