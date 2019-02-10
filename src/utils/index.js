const chalk = require('chalk')
const ramda = require('ramda')

// we don't export run.js here because it has a dependency
// on the components directory, which has dependency on
// this utils directory...causing circular dependency
const fs = require('./fs')
const sleep = require('./sleep')
const getCli = require('./getCli')
const getCredentials = require('./getCredentials')
const titelize = require('./titelize')

module.exports = {
  ...ramda,
  ...fs,
  sleep,
  getCli,
  getCredentials,
  titelize,
  chalk
}
