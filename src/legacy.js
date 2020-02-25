const utils = require('./cli/utils')

const runningComponents = () => {
  let componentConfig, instanceConfig

  try {
    componentConfig = utils.legacyLoadComponentConfig(process.cwd())
  } catch (e) {}
  try {
    instanceConfig = utils.legacyLoadInstanceConfig(process.cwd())
  } catch (e) {}

  if (!componentConfig && !instanceConfig) {
    return false
  }

  if (instanceConfig && !instanceConfig.component) {
    return false
  }

  return true
}

module.exports = { runningComponents }
