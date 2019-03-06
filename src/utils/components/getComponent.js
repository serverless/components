const { readFile } = require('@serverless/utils')
const path = require('path')
const { forEachObjIndexed, replace } = require('ramda')
const validateCoreVersion = require('../validateCoreVersion')

const getServiceId = require('../state/getServiceId')
const transformPostExecutionVars = require('../variables/transformPostExecutionVars')
const resolvePreExecutionVars = require('../variables/resolvePreExecutionVars')
const validateVarsUsage = require('../variables/validateVarsUsage')
const getInstanceId = require('./getInstanceId')
const setInputDefaults = require('./setInputDefaults')
const validateInputs = require('./validateInputs')

module.exports = async (componentRoot, componentId, inputs, stateFile) => {

  let json = {}

  // Get promise for each route in routes from inputs
  const getChildJSON = async (value, key) => {
    if(value != null && typeof value == 'string' && value.startsWith('${file:')) {
      const keylen = value.length
      const methodPath = value.substring(7, keylen - 1)
      const methodJson = await readFile(path.join("./", methodPath))
      return methodJson
    } else {
      return value
    }
  }

  let childPromises = []

  // Get promise for each object in inputs
  const getJSON = async (k, v) => {
    if(v != null && typeof v == 'string' && v.startsWith('${file:')) {
      const len = v.length
      const childPath = v.substring(7, len - 1)
      const childJson = await readFile(path.join("./", childPath))
      forEachObjIndexed((value, key) => {
        childJson[key] = getChildJSON(value, key)
        childPromises.push(childJson[key])
      }, childJson)
      json[k] = childJson
      return childJson
    }
  }
  
  let promises = []

  forEachObjIndexed((v, k) => {
    promises.push(getJSON(k, v))
  }, inputs)

  let slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))

  await Promise.all(promises)

  await Promise.all(childPromises)

  // Replace resolved promises to actual value
  forEachObjIndexed((v, k) => {
    forEachObjIndexed((vc, kc) => {
      vc.then(d => {
        v[kc] = d
      })
    }, v)
  }, json)

  validateVarsUsage(slsYml)
  validateCoreVersion(slsYml.type, slsYml.core)

  slsYml.id = componentId || slsYml.type

  forEachObjIndexed((componentObj, componentAlias) => {
    componentObj.id = `${slsYml.id}:${componentAlias}`
  }, slsYml.components)

  slsYml = await transformPostExecutionVars(slsYml)

  slsYml.inputs = { ...slsYml.inputs, ...inputs, ...json }

  slsYml = await resolvePreExecutionVars(
    {
      path: path.resolve(componentRoot).replace(/\/*$/, ''),
      serviceId: getServiceId(stateFile),
      instanceId: getInstanceId(stateFile, slsYml.id)
    },
    slsYml
  )

  slsYml.inputs = setInputDefaults(slsYml.inputTypes, slsYml.inputs)

  return slsYml
}
