const { forEachObjIndexed, map, not, isEmpty, union, pickBy, prop } = require('ramda')
const getComponentFunctions = require('./getComponentFunctions')
const getChildrenIds = require('./getChildrenIds')
const getState = require('../state/getState')
const getInputs = require('../state/getInputs')
const deferredPromise = require('../deferredPromise')

async function getComponentsFromStateFile(stateFile) {
  let componentIds = []
  forEachObjIndexed((value, key) => {
    const state = getState(stateFile, key)
    if (not(isEmpty(state)) && not(prop('internallyManaged', value))) {
      componentIds = union(componentIds, [ key ])
    }
  }, pickBy((k) => k !== '$', stateFile))
  const componentsInfo = map(async (id) => {
    const component = stateFile[id]
    const { type } = component
    return {
      [id]: {
        id,
        type,
        inputs: getInputs(stateFile, id),
        outputs: {},
        state: getState(stateFile, id),
        dependencies: [], // TODO: do we need to determine the dependencies here?
        children: getChildrenIds(component),
        promise: deferredPromise(),
        fns: getComponentFunctions(type)
      }
    }
  }, componentIds)
  return Object.assign({}, ...(await Promise.all(componentsInfo)))
}

module.exports = getComponentsFromStateFile
