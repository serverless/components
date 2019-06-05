const chalk = require('chalk')
const ramda = require('ramda')
const fs = require('./fs')
const sleep = require('./sleep')
const prepareCredentials = require('./prepareCredentials')
const titelize = require('./titelize')
const api = require('./api')

module.exports = {
  ...ramda,
  ...fs,
  sleep,
  prepareCredentials,
  titelize,
  chalk,
  api
}
