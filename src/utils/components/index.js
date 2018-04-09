const generateInstanceId = require('./generateInstanceId')
const getComponentsToUse = require('./getComponentsToUse')
const getInstanceId = require('./getInstanceId')
const getExecutedComponents = require('./getExecutedComponents')
const getComponent = require('./getComponent')
const getComponentFunctions = require('./getComponentFunctions')
const getComponentsFromStateFile = require('./getComponentsFromStateFile')
const getComponentsToRemove = require('./getComponentsToRemove')
const executeComponent = require('./executeComponent')
const generateContext = require('./generateContext')

module.exports = {
  generateInstanceId,
  getComponentsToUse,
  getInstanceId,
  getComponentFunctions,
  getComponentsFromStateFile,
  getComponentsToRemove,
  getExecutedComponents,
  getComponent,
  executeComponent,
  generateContext
}
