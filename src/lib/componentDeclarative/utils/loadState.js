const { readState, reduce, assoc } = require('../../../utils')

function loadState(ids) {
  return reduce(
    (accum, id) => {
      // TODO: update so that there's no splitting necessary
      const componentId = id.split('.').pop()
      return assoc(componentId, readState(id), accum)
    },
    {},
    ids
  )
}

module.exports = loadState
