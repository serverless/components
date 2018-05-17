const path = require('path')
const { isNil } = require('ramda')
const urlRegex = require('url-regex')
const getComponentFromUrl = require('./getComponentFromUrl')
const getComponentsBucketRoot = require('./getComponentsBucketRoot')
const getRegistryRoot = require('../registry/getRegistryRoot')

const typeRegexDefinition = '[a-zA-Zd](?:[a-zA-Zd]|(-|_)(?=[a-zA-Zd])){0,38}'
const semVerDefinition =
  '(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-[\\da-z-]+(?:\\.[\\da-z-]+)*)?(?:\\+[\\da-z-]+(?:\\.[\\da-z-]+)*)?'
const registryRegex = new RegExp(`^${typeRegexDefinition}@${semVerDefinition}$`)

async function getComponentRootPath(type = null) {
  if (urlRegex({ exact: true }).test(type)) {
    return getComponentFromUrl(type)
  } else if (type.match(registryRegex)) {
    const url = `${getComponentsBucketRoot()}/${type}.zip`
    return getComponentFromUrl(url)
  } else if (type.match(/(.+\/)+/)) {
    return path.resolve(type)
  }
  return path.join(getRegistryRoot(), type)
}

module.exports = getComponentRootPath
