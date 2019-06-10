const downloadComponents = require('./downloadComponents')
const loadComponent = require('./loadComponent')

const loadComponentsFromNpm = async (componentsPackageNames) => {
  const componentsPaths = await downloadComponents(componentsPackageNames)

  const loadedComponents = {}

  for (const componentPackageName of componentsPackageNames) {
    loadedComponents[componentPackageName] = await loadComponent(
      componentsPaths[componentPackageName]
    )
  }

  return loadedComponents
}

module.exports = loadComponentsFromNpm
