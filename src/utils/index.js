const chalk = require('chalk')
const utils = require('@serverless/utils')

const callFunc = require('./callFunc')
const getCli = require('./getCli')
const readState = require('./readState')
const run = require('./run')
const writeState = require('./writeState')

module.exports = {
  ...utils,
  callFunc,
  getCli,
  readState,
  writeState,
  run,
  chalk
}
