const utils = require('./cli/utils')

const runningComponents = () => {

  let componentConfig, instanceConfig

  try { componentConfig = utils.loadComponentConfig(process.cwd()) } catch (e) {}
  try { instanceConfig = utils.loadInstanceConfig(process.cwd()) } catch (e) {}

  if (!componentConfig && !instanceConfig) {
    return false
  } else {
    return true
  }
}

module.exports = { runningComponents }