const generateInstanceId = require('./generateInstanceId')
const getComponentsToUse = require('./getComponentsToUse')
const getInstanceId = require('./getInstanceId')
const getExecutedComponents = require('./getExecutedComponents')
const getComponent = require('./getComponent')
const getComponentsToRemove = require('./getComponentsToRemove')
const executeComponent = require('./executeComponent')
const generateContext = require('./generateContext')

module.exports = {
  generateInstanceId,
  getComponentsToUse,
  getInstanceId,
  getComponentsToRemove,
  getExecutedComponents,
  getComponent,
  executeComponent,
  generateContext
}
