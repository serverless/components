const path = require('path')
const { forEachObjIndexed } = require('ramda')
const { readFile } = require('../fs')
const getServiceId = require('../state/getServiceId')
const transformPostExecutionVars = require('../variables/transformPostExecutionVars')
const resolvePreExecutionVars = require('../variables/resolvePreExecutionVars')
const getInstanceId = require('./getInstanceId')
const setInputDefaults = require('./setInputDefaults')
const validateInputs = require('./validateInputs')
const getComponentType = require('./getComponentType')

module.exports = async (componentRoot, componentId, inputs, stateFile) => {
  let slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))

  slsYml.id = componentId || slsYml.type

  // replace the type property here if it includes a path
  // NOTE: order is important since the id above
  // should not include the path
  slsYml.type = getComponentType(componentRoot)

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

  validateInputs(slsYml.id, slsYml.inputTypes, slsYml.inputs)

  return slsYml
}
