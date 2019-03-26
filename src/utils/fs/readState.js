const path = require('path')
const fs = require('fs')

// this needs to be a sync function
// because it's called in the Component constructor
const readState = (id) => {
  const stateFilePath = path.join(process.cwd(), '.serverless', `${id}.json`)
  if (fs.existsSync(stateFilePath)) {
    return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'))
  }
  return {}
}

module.exports = readState
