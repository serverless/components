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
  const slsYml = await getComponent(componentRoot, componentId, inputs)

  const dependencies = getDependencies(slsYml.inputs)

  const nestedComponents = await reduce(async (accum, componentAlias) => {
    accum = await Promise.resolve(accum)
    const nestedComponentRoot = path.join(getRegistryRoot(), slsYml.components[componentAlias].type)
    const nestedComponentInputs = slsYml.components[componentAlias].inputs || {}
    const nestedComponentId = slsYml.components[componentAlias].id
    accum = await getComponentsToUse(
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

  const children = reduce((accum, componentAlias) => {
    accum[componentAlias] = slsYml.components[componentAlias].id
    return accum
  }, {}, keys(slsYml.components) || [])

  components[slsYml.id] = {
    id: slsYml.id,
    type: slsYml.type,
    inputs: slsYml.inputs,
    outputs: {},
    children, { myRole: 'my-projct:myRole '}
    state: getState(stateFile, slsYml.id),
    dependencies,
    fns
  }
  return { ...components, ...nestedComponents }
}

module.exports = getComponentsToUse
