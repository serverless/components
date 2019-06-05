const { readState } = require('../../../utils')

async function loadState(state) {
  return state.components.reduce(async (accum, config) => {
    accum = await accum
    const id = config.stateFileName
      .split('.')
      .slice(0, -1)
      .join('.')
    accum[config.instanceId] = await readState(id)
    return accum
  }, {})
}

module.exports = loadState
