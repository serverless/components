const getComponentsToUse = require('./getComponentsToUse')
const getComponent = require('./getComponent')
const getComponentsToRemove = require('./getComponentsToRemove')
const executeComponent = require('./executeComponent')
const generateContext = require('./generateContext')

module.exports = {
  getComponentsToUse,
  getComponentsToRemove,
  getComponent,
  executeComponent,
  generateContext
}
