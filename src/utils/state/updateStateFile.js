const path = require('path')
const { forEachObjIndexed } = require('ramda')
const writeFile = require('../fs/writeFile')

module.exports = async (components) => {
  const stateFilePath = path.join(process.cwd(), 'state.json')
  const state = {}
  forEachObjIndexed((component) => {
    state[component.id] = component.state
  }, components)
  return writeFile(stateFilePath, state)
}
