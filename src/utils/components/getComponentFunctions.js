const path = require('path')

const getComponentFunctions = (componentRoot) => {
  let fns = {}
  try {
    fns = require(componentRoot) // eslint-disable-line global-require, import/no-dynamic-require
  } catch (error) {
    const moduleName = error.message.split("'")[1]
    if (moduleName) {
      const includesPathInfo = new RegExp(path.sep)
      if (!moduleName.match(includesPathInfo)) {
        const msg = [
          `Cannot find module '${moduleName}'.`,
          'Have you installed all component dependencies?'
        ].join(' ')
        throw new Error(msg)
      }
    }
  } // eslint-disable-line no-empty
  return fns
}

module.exports = getComponentFunctions
