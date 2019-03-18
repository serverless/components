const getComponentId = require('./getComponentId')
const getFileNames = require('./getFileNames')
const getId = require('./getId')
const { readState, reduce, assoc } = require('../../../../utils')

async function load() {
  const files = await getFileNames()
  return reduce(
    (accum, file) => {
      const id = getId(file)
      const componentId = getComponentId(file)
      return assoc(componentId, readState(id), accum)
    },
    {},
    files
  )
}

module.exports = load
