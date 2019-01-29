const chalk = require('chalk')
const utils = require('@serverless/utils')

// we don't export run.js here because it has a dependency
// on the components directory, which has dependency on
// this utils directory...causing circular dependency
const getCli = require('./getCli')
const readState = require('./readState')
const writeState = require('./writeState')

module.exports = {
  ...utils,
  getCli,
  readState,
  writeState,
  chalk
}
