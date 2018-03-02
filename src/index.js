const utils = require('./utils')

const {
  getComponents, buildGraph, executeGraph, readStateFile, updateStateFile
} = utils

const run = async (command, options) => {
  const stateFile = await readStateFile()
  const components = await getComponents(stateFile)
  const graph = await buildGraph(components)
  await executeGraph(graph, components, command, options)
  await updateStateFile(components)
  return components
}

module.exports = {
  ...utils,
  run
}
