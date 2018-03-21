const path = require('path')
const { forEachObjIndexed } = require('ramda')
const { readFile } = require('../fs')

const transformPostExecutionVars = require('../variables/transformPostExecutionVars')
const resolvePreExecutionVars = require('../variables/resolvePreExecutionVars')
const setInputDefaults = require('./setInputDefaults')
const validateInputs = require('./validateInputs')

module.exports = async (componentRoot, componentId, inputs) => {
  let slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))

  slsYml.id = componentId || slsYml.type

  forEachObjIndexed((componentObj, componentAlias) => {
    componentObj.id = `${slsYml.id}:${componentAlias}`
  }, slsYml.components)

  slsYml = await transformPostExecutionVars(slsYml)

  slsYml.inputs = { ...slsYml.inputs, ...inputs }

  slsYml = await resolvePreExecutionVars({
    path: path.resolve(componentRoot).replace(/\/*$/, '')
  }, slsYml)

  slsYml.inputs = setInputDefaults(slsYml.inputTypes, slsYml.inputs)

  validateInputs(slsYml.id, slsYml.inputTypes, slsYml.inputs)

  return slsYml
}
