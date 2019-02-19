const constructObjects = require('./constructObjects')
const getMatches = require('./getMatches')
const regex = require('./regex')
const resolveComponentVariables = require('./resolveComponentVariables')
const resolveServerlessFile = require('./resolveServerlessFile')
const resolveSimpleVariable = require('./resolveSimpleVariable')
const types = require('./types')

module.exports = {
  constructObjects,
  getMatches,
  regex,
  resolveComponentVariables,
  resolveServerlessFile,
  resolveSimpleVariable,
  types
}
