const path = require('path')
const {
  difference, keys, reduce, isEmpty, forEachObjIndexed, union, not
} = require('ramda')
const getRegistryRoot = require('../getRegistryRoot')
const { fileExists } = require('../fs')
const getState = require('../state/getState')

async function getComponentsToRemove(stateFile, loadedComponents) {
  // TODO: make code functional
  let componentIdsInStateFile = []
  forEachObjIndexed((value, key) => {
    const state = getState(stateFile, key)
    if (not(isEmpty(state))) {
      componentIdsInStateFile = union(componentIdsInStateFile, [ key ])
    }
  }, stateFile)
  const componentIdsInServerlessYml = keys(loadedComponents)
  const componentsToRemove = difference(componentIdsInStateFile, componentIdsInServerlessYml)

  return reduce(
    async (accum, id) => {
      const component = stateFile[id]
      const { type } = component
      // TODO: this code is used in other places as well --> DRY it
      const componentRoot = path.join(getRegistryRoot(), type)
      let fns = {}
      if (await fileExists(path.join(componentRoot, 'index.js'))) {
        fns = require(path.join(componentRoot, 'index.js')) // eslint-disable-line
      }
      accum[id] = {
        id,
        type,
        inputs: {},
        outputs: {},
        state: getState(stateFile, id),
        dependencies: [], // TODO: do we need to determine the dependencies here?
        fns
      }
      return accum
    },
    {},
    componentsToRemove
  )
}

module.exports = getComponentsToRemove
