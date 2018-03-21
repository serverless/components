const { keys, reduce } = require('ramda')
const getState = require('../state/getState')
const findComponent = require('../findComponent')

const generateContext = (component, stateFile, archive, options, command) => {
  const { id, type } = component
  const context = {
    id,
    type,
    archive: getState(archive, id),
    state: getState(stateFile, id),
    command,
    options,
    log: (message) => {
      if (!process.env.CI) {
        process.stdin.write(`${message}\n`)
      }
    },
    load: (loadType, alias) => {
      // eslint-disable-line no-shadow
      const childComponent = require(findComponent(loadType)) // eslint-disable-line
      childComponent.id = `${id}:${alias}`
      const childComponentContext = generateContext(
        childComponent,
        stateFile,
        archive,
        options,
        command
      )

      const fnNames = keys(childComponent)

      const modifiedComponent = reduce(
        (accum, fnName) => {
          const childComponentFn = childComponent[fnName]
          accum[fnName] = async (inputs) => childComponentFn(inputs, childComponentContext)
          return accum
        },
        {},
        fnNames
      )

      return modifiedComponent
    },
    saveState(state = {}) {
      // eslint-disable-line
      // NOTE: set default values if information about component in stateFile is not yet present
      if (!stateFile[this.id]) {
        stateFile[this.id] = {
          type,
          state: {}
        }
      }
      stateFile[this.id].state = state
      this.state = state
    }
  }
  return context
}

module.exports = generateContext
