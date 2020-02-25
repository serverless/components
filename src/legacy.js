const utils = require('./cli/utils')

const runningComponents = () => {

  let componentConfig, instanceConfig

  try { componentConfig = await utils.loadComponentConfig(process.cwd()) } catch (e) {}
  try { instanceConfig = await utils.loadInstanceConfig(process.cwd()) } catch (e) {}

  if (!componentConfig && !instanceConfig) {
    return false
  }

  if (instanceConfig && !instanceConfig.component) {
    return false
  }

  return true
}

module.exports = { runningComponents }