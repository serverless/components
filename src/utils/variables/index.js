const resolvePreExecutionVars = require('./resolvePreExecutionVars')
const resolveInputsVars = require('./resolveInputsVars')
const resolveStateVars = require('./resolveStateVars')
const transformPostExecutionVars = require('./transformPostExecutionVars')

module.exports = {
  resolvePreExecutionVars,
  resolveInputsVars,
  resolveStateVars,
  transformPostExecutionVars
}
