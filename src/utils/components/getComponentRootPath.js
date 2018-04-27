const path = require('path')
const urlRegex = require('url-regex')

const getRegistryRoot = require('../getRegistryRoot')
const getComponentFromUrl = require('./getComponentFromUrl')
const { isNil } = require('ramda')

async function getComponentRootPath(type = null) {
  if (isNil(type)) {
    return process.cwd()
  } else if (urlRegex({ exact: true }).test(type)) {
    return getComponentFromUrl(type)
  } else if (type.match(/(.+\/)+/)) {
    return path.resolve(type)
  }
  return path.join(getRegistryRoot(), type)
}

module.exports = getComponentRootPath
