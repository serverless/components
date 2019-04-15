const { readState } = require('../../../utils')
const meta = require('./meta')

async function loadState() {
  const metaData = await meta.load()

  return metaData.components.reduce(async (accum, config) => {
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
