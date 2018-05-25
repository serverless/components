const { readFile } = require('@serverless/utils')
const path = require('path')
const { forEachObjIndexed } = require('ramda')
const getServiceId = require('../state/getServiceId')
const transformPostExecutionVars = require('../variables/transformPostExecutionVars')
const resolvePreExecutionVars = require('../variables/resolvePreExecutionVars')
const validateVarsUsage = require('../variables/validateVarsUsage')
const getInstanceId = require('./getInstanceId')
const setInputDefaults = require('./setInputDefaults')
const validateCoreVersion = require('./validateCoreVersion')
const validateTypes = require('./validateTypes')

module.exports = async (componentRoot, componentId, inputs, stateFile, slsYml = null) => {
  if (!slsYml) {
    slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))
  }

  validateVarsUsage(slsYml)
  validateCoreVersion(slsYml.type, slsYml.core)

  slsYml.id = componentId || slsYml.type

  forEachObjIndexed((componentObj, componentAlias) => {
    componentObj.id = `${slsYml.id}:${componentAlias}`
  }, slsYml.components)

  slsYml = await transformPostExecutionVars(slsYml)

  slsYml.inputs = { ...slsYml.inputs, ...inputs }

  slsYml = await resolvePreExecutionVars(
    {
      path: path.resolve(componentRoot).replace(/\/*$/, ''),
      serviceId: getServiceId(stateFile),
      instanceId: getInstanceId(stateFile, slsYml.id)
    },
    slsYml
  )

  slsYml.inputs = setInputDefaults(slsYml.inputTypes, slsYml.inputs)

  validateTypes(slsYml.id, slsYml.inputTypes, slsYml.inputs, { prefix: 'Input' })

  return slsYml
}
