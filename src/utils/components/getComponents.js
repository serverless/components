const path = require('path')
const R = require('ramda')

const getRegistryRoot = require('../getRegistryRoot')
const fs = require('../fs')

const resolvePreExecutionVars = require('../variables/resolvePreExecutionVars')
const transformPostExecutionVars = require('../variables/transformPostExecutionVars')
const getDependencies = require('../variables/getDependencies')


const { readFile, fileExists } = fs
const {
  reduce, keys, forEachObjIndexed
} = R

const generateNestedComponentsIds = (slsYml) => {
  forEachObjIndexed((componentObj, componentAlias) => {
    componentObj.id = `${slsYml.id}:${componentAlias}`
  }, slsYml.components)
  return slsYml
}

const getComponents = async (
  stateFile, componentRoot = process.cwd(), inputs = {}, componentId, components = {}
) => {
  let slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))

  slsYml.id = componentId || slsYml.type

  slsYml = generateNestedComponentsIds(slsYml)

  slsYml = await transformPostExecutionVars(slsYml)

  slsYml.inputs = { ...slsYml.inputs, ...inputs } // shallow merge

  slsYml = await resolvePreExecutionVars(slsYml)
  const dependencies = getDependencies(slsYml.inputs)

  const nestedComponents = await reduce(async (accum, componentAlias) => {
    accum = await Promise.resolve(accum)
    const nestedComponentRoot = path.join(getRegistryRoot(), slsYml.components[componentAlias].type)
    const nestedComponentInputs = slsYml.components[componentAlias].inputs
    const nestedComponentId = slsYml.components[componentAlias].id
    accum = await getComponents(
      stateFile,
      nestedComponentRoot,
      nestedComponentInputs,
      nestedComponentId,
      accum
    )
    return accum
  }, Promise.resolve(components), keys(slsYml.components) || [])

  let fns = {}
  if (await fileExists(path.join(componentRoot, 'index.js'))) {
    fns = require(path.join(componentRoot, 'index.js')) // eslint-disable-line
  }

  components[slsYml.id] = {
    id: slsYml.id,
    inputs: slsYml.inputs,
    outputs: {},
    state: stateFile[componentId] || {},
    dependencies,
    fns
  }
  return { ...components, ...nestedComponents }
}

module.exports = getComponents
