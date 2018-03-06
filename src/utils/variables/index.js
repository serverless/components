const resolvePreExecutionVars = require('./resolvePreExecutionVars')
const resolvePostExecutionVars = require('./resolvePostExecutionVars')
const transformPostExecutionVars = require('./transformPostExecutionVars')
const getDependencies = require('./getDependencies')
const getVariableSyntax = require('./getVariableSyntax')

module.exports = {
  resolvePreExecutionVars,
  resolvePostExecutionVars,
  transformPostExecutionVars,
  getDependencies,
  getVariableSyntax
}
