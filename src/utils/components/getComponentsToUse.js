const path = require('path')
const { reduce, keys } = require('ramda')
const getRegistryRoot = require('../getRegistryRoot')
const { fileExists } = require('../fs')
const getComponent = require('./getComponent')
const getDependencies = require('../variables/getDependencies')
const getState = require('../state/getState')

const getComponentsToUse = async (
  stateFile,
  componentRoot = process.cwd(),
  inputs = {},
  componentId,
  components = {}
) => {
  const slsYml = await getComponent(componentRoot, componentId, inputs, stateFile)

  const dependencies = getDependencies(slsYml.inputs)

  const nestedComponents = await reduce(async (accum, componentAlias) => {
    const nestedComponentRoot = path.join(getRegistryRoot(), slsYml.components[componentAlias].type)
    const nestedComponentInputs = slsYml.components[componentAlias].inputs || {}
    const nestedComponentId = slsYml.components[componentAlias].id
    return getComponentsToUse(
      stateFile,
      nestedComponentRoot,
      nestedComponentInputs,
      nestedComponentId,
      await accum
    )
  }, Promise.resolve(components), keys(slsYml.components) || [])

  let fns = {}
  if (await fileExists(path.join(componentRoot, 'index.js'))) {
    fns = require(path.join(componentRoot, 'index.js')) // eslint-disable-line
  }

  components[slsYml.id] = {
    id: slsYml.id,
    type: slsYml.type,
    inputs: slsYml.inputs,
    outputs: {},
    state: getState(stateFile, slsYml.id),
    dependencies,
    fns
  }
  return { ...components, ...nestedComponents }
}

module.exports = getComponentsToUse
