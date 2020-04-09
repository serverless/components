const utils = require('./cli/utils')
const {
  utils: { isChinaUser }
} = require('@serverless/platform-client-china')

const runningComponents = () => {
  let componentConfig, instanceConfig

  if (process.argv[2] === 'registry') {
    return true
  }

  try {
    componentConfig = utils.legacyLoadComponentConfig(process.cwd())
  } catch (e) {}
  try {
    instanceConfig = utils.legacyLoadInstanceConfig(process.cwd())
  } catch (e) {}

  if (!componentConfig && !instanceConfig) {
    // When no in service context and plain `serverless` command, return true when user in China
    // It's to enable interactive CLI components onboarding for Chinese users
    return process.argv.length === 2 && isChinaUser()
  }

  if (instanceConfig && !instanceConfig.component) {
    return false
  }

  return true
}

module.exports = { runningComponents }
