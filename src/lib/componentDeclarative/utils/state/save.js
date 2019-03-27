const path = require('path')
const { writeFile } = require('../../../../utils')

async function save(component, instanceId, stage, state = {}) {
  const stateFilePath = path.join(
    process.cwd(),
    '.serverless',
    `${stage}.declarative.${instanceId}.json`
  )
  const stateObject = {
    [`${component}::${instanceId}`]: state
  }
  return writeFile(stateFilePath, stateObject)
}

module.exports = save
