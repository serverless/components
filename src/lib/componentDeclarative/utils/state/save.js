const path = require('path')
const { writeFile } = require('../../../../utils')

async function save(component, instanceId, state = {}) {
  const stateFilePath = path.join(process.cwd(), '.serverless', `declarative.${instanceId}.json`)
  const stateObject = {
    [`${component}::${instanceId}`]: state
  }
  return writeFile(stateFilePath, stateObject)
}

module.exports = save
