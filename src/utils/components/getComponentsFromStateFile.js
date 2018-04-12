const { keys, reduce, not, isEmpty, append, pickBy, prop } = require('ramda')
const reduceIndexed = require('../reduceIndexed')
const getComponentFunctions = require('./getComponentFunctions')
const getChildrenIds = require('./getChildrenIds')
const getState = require('../state/getState')
const getInputs = require('../state/getInputs')
const deferredPromise = require('../deferredPromise')

function getComponentsFromStateFile(stateFile) {
  const componentIds = reduceIndexed((accum, stateFileKey) => {
    const state = getState(stateFile, stateFileKey)
    if (not(isEmpty(state)) && not(prop('internallyManaged', prop(stateFileKey, stateFile)))) {
      return append(stateFileKey, accum)
    }
    return accum
  }, [], keys(pickBy((v, k) => k !== '$', stateFile)))
  return reduce((accum, id) => {
    const component = stateFile[id]
    const { type } = component
    return {
      ...accum,
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
  }, {}, componentIds)
}

module.exports = getComponentsFromStateFile
