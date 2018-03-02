const path = require('path')
const R = require('ramda')

const getRegistryRoot = require('../getRegistryRoot')
const fs = require('../fs')

const resolveEnvVars = require('../variables/resolveEnvVars')
const resolveInputsVars = require('../variables/resolveInputsVars')
const transformStateVars = require('../variables/transformStateVars')
const getComponentDependencies = require('../variables/getComponentDependencies')


const { readFile, fileExists } = fs
const { mergeDeepRight, reduce, keys } = R


const getComponents = async (
  stateFile, componentRoot = process.cwd(), inputs = {}, componentId, components = {}
) => {
  let slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))
  slsYml.inputs = mergeDeepRight(slsYml.inputs || {}, inputs)
  slsYml = await resolveEnvVars(slsYml)
  slsYml = await resolveInputsVars(slsYml)

  componentId = componentId || slsYml.type

  slsYml = await transformStateVars(slsYml, componentId)
  const dependencies = getComponentDependencies(slsYml)

  const nestedComponents = await reduce(async (accum, componentAlias) => {
    accum = await Promise.resolve(accum)
    const nestedComponentRoot = path.join(getRegistryRoot(), slsYml.components[componentAlias].type)
    const nestedComponentInputs = slsYml.components[componentAlias].inputs
    const nestedComponentId = `${componentId}:${componentAlias}`
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

  components[componentId] = {
    id: componentId,
    inputs: slsYml.inputs,
    outputs: {},
    state: stateFile[componentId] || {},
    dependencies: [],
    fns
  }
  return { ...components, ...nestedComponents }
}

module.exports = getComponents
