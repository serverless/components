const fs = require('./fs')
const misc = require('./misc')
const log = require('./log')
const getRegistryRoot = require('./getRegistryRoot')
const state = require('./state')
const telemetry = require('./telemetry')
const config = require('./config')
const components = require('./components')
const dag = require('./dag')
const mapIndexed = require('./mapIndexed')
const reduceIndexed = require('./reduceIndexed')
const reduceObjIndexed = require('./reduceObjIndexed')
const variables = require('./variables')
const validateCoreVersion = require('./validateCoreVersion')

module.exports = {
  ...components,
  ...config,
  ...dag,
  ...fs,
  ...misc,
  ...state,
  ...telemetry,
  ...variables,
  getRegistryRoot,
  validateCoreVersion,
  log,
  mapIndexed,
  reduceIndexed,
  reduceObjIndexed
}
