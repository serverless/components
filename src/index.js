/*
* Serverless Framework v2.0
*/

const Component = require('./lib/component/serverless')
const run = require('./lib/run')
const watch = require('./lib/watch')

module.exports = {
  run,
  watch,
  Component,
}
