const misc = require('./misc')
const log = require('./log')
const getRegistryRoot = require('./getRegistryRoot')
const getRegistryComponentsRoots = require('./getRegistryComponentsRoots')
const state = require('./state')
const telemetry = require('./telemetry')
const components = require('./components')
const dag = require('./dag')
const mapIndexed = require('./mapIndexed')
const reduceIndexed = require('./reduceIndexed')
const reduceObjIndexed = require('./reduceObjIndexed')
const variables = require('./variables')
const validateCoreVersion = require('./validateCoreVersion')

module.exports = {
  ...components,
  ...dag,
  ...misc,
  ...state,
  ...telemetry,
  ...variables,
  getRegistryRoot,
  getRegistryComponentsRoots,
  validateCoreVersion,
  log,
  mapIndexed,
  reduceIndexed,
  reduceObjIndexed
}
