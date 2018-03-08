const fs = require('./fs')
const log = require('./log')
const getRegistryRoot = require('./getRegistryRoot')
const state = require('./state')
const telemetry = require('./telemetry')
const components = require('./components')
const dag = require('./dag')
const variables = require('./variables')

module.exports = {
  ...fs,
  ...state,
  ...telemetry,
  ...variables,
  ...components,
  ...dag,
  log,
  getRegistryRoot
}
