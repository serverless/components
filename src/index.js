const utils = require('./utils')

const {
  errorReporter,
  getComponentsToUse,
  getComponentsToRemove,
  buildGraph,
  executeGraph,
  readStateFile,
  writeStateFile,
  trackDeployment
} = utils

const run = async (command, options) => {
  const reporter = await errorReporter()
  let components = {}
  let stateFile = {}
  try {
    stateFile = await readStateFile()
    const componentsToUse = await getComponentsToUse(stateFile)
    const componentsToRemove = await getComponentsToRemove(stateFile, componentsToUse)
    components = { ...componentsToUse, ...componentsToRemove }
    if (command === 'deploy') trackDeployment(componentsToUse)
    const graph = await buildGraph(componentsToUse, componentsToRemove, command)
    await executeGraph(graph, components, stateFile, options)
  } catch (error) {
    if (reporter) {
      reporter.captureException(error)
    }
    throw error
  } finally {
    await writeStateFile(stateFile)
  }
  return components
}

module.exports = {
  ...utils,
  run
}
