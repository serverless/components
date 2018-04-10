const path = require('path')
const { assoc, keys, merge, reduce } = require('ramda')
const deferredPromise = require('../deferredPromise')
const getRegistryRoot = require('../getRegistryRoot')
const getChildrenIds = require('./getChildrenIds')
const getComponent = require('./getComponent')
const requireFns = require('./requireFns')
const getDependencies = require('../variables/getDependencies')
const getState = require('../state/getState')

const getComponentsFromServerlessFile = async (
  stateFile,
  componentRoot = process.cwd(),
  inputs = {},
  componentId,
  components = {}
) => {
  const component = await getComponent(componentRoot, componentId, inputs, stateFile)

  const nestedComponents = await reduce(
    async (accum, componentAlias) => {
      accum = await Promise.resolve(accum)
      const nestedComponentRoot = path.join(
        getRegistryRoot(),
        component.components[componentAlias].type
      )
      const nestedComponentInputs = component.components[componentAlias].inputs || {}
      const nestedComponentId = component.components[componentAlias].id
      accum = await getComponentsFromServerlessFile(
        stateFile,
        nestedComponentRoot,
        nestedComponentInputs,
        nestedComponentId,
        await accum
      )
      return accum
    },
    Promise.resolve(components),
    keys(component.components) || []
  )

  components = assoc(
    component.id,
    {
      id: component.id,
      type: component.type,
      inputs: component.inputs,
      outputs: {},
      state: getState(stateFile, component.id),
      dependencies: getDependencies(component.inputs),
      children: getChildrenIds(component) || {},
      promise: deferredPromise(),
      fns: requireFns(componentRoot)
    },
    components
  )

  return merge(components, nestedComponents)
}

module.exports = getComponentsFromServerlessFile
