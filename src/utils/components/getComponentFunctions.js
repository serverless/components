const fs = require('fs')
const path = require('path')

const getComponentFunctions = (componentRoot) => {
  let fns = {}
  try {
    const indexPath = path.resolve(componentRoot, 'index.js')
    if (fileExistsSync(indexPath)) {
      fns = require(componentRoot) // eslint-disable-line global-require, import/no-dynamic-require
    }
  } catch (error) {
    const moduleName = error.message.split("'")[1]
    if (moduleName) {
      if (!moduleName.includes(path.sep)) {
        const msg = [
          `Cannot find module '${moduleName}'.`,
          'Have you installed all component dependencies?'
        ].join(' ')
        throw new Error(msg)
      }
    }
    // Do not swallow component code errors
    throw error
  }
  return fns
}

function fileExistsSync(filePath) {
  try {
    const stats = fs.lstatSync(filePath)
    return stats.isFile()
  } catch (e) {
    return false
  }
}

module.exports = getComponentFunctions
