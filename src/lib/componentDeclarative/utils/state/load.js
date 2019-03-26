const process = require('process')
const path = require('path')
const getFileNames = require('./getFileNames')
const { readFile, reduce, assoc } = require('../../../../utils')

async function load() {
  const files = await getFileNames()
  return reduce(
    async (accum, file) => {
      const stateFilePath = path.join(process.cwd(), '.serverless', file)
      const content = await readFile(stateFilePath)
      const component = Object.keys(content)[0]
      const state = content[component]
      return assoc(component, state, await accum)
    },
    {},
    files
  )
}

module.exports = load
