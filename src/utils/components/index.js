const generateInstanceId = require('./generateInstanceId')
const getComponentsToUse = require('./getComponentsToUse')
const getExecutedComponents = require('./getExecutedComponents')
const getComponent = require('./getComponent')
const getComponentsToRemove = require('./getComponentsToRemove')
const executeComponent = require('./executeComponent')
const generateContext = require('./generateContext')

module.exports = {
  generateInstanceId,
  getComponentsToUse,
  getComponentsToRemove,
  getExecutedComponents,
  getComponent,
  executeComponent,
  generateContext
}
