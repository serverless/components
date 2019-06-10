const downloadComponents = require('./downloadComponents')
const loadComponent = require('./loadComponent')
const api = require('../api')

const initNpmComponent = async (componentPackageName, config = {}) => {
  const componentPath = (await downloadComponents([componentPackageName]))[componentPackageName]

  const componentClass = await loadComponent(componentPath)

  const classConfig = {
    ui: config.ui || api,
    context: {
      stage: config.stage || 'dev',
      root: config.root || process.cwd(),
      verbose: config.verbose || false
    }
  }

  const component = new componentClass(classConfig)

  return component
}

module.exports = initNpmComponent
