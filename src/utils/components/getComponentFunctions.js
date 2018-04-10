const path = require('path')
const getComponentRootPath = require('./getComponentRootPath')
const requireFns = require('./requireFns')

function getComponentFunctions(type) {
  let componentRoot
  const cwd = process.cwd()
  const dirName = cwd.split(path.sep).pop()
  if (dirName === type) {
    componentRoot = cwd
  } else {
    componentRoot = getComponentRootPath(type)
  }
  return requireFns(componentRoot)
}

module.exports = getComponentFunctions
