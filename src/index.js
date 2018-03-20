const chalk = require('chalk')
const { clone } = require('ramda')
const utils = require('./utils')

const {
  errorReporter,
  getComponentsToUse,
  getComponentsToRemove,
  getExecutedComponents,
  buildGraph,
  executeGraph,
  readStateFile,
  writeStateFile,
  trackDeployment,
  log
} = utils

const run = async (command, options) => {
  const reporter = await errorReporter()
  let components = {}
  let stateFile = {}
  let archive = {}
  try {
    stateFile = await readStateFile()
    archive = clone(stateFile)
    const componentsToUse = await getComponentsToUse(stateFile)
    const componentsToRemove = await getComponentsToRemove(stateFile, componentsToUse)
    components = { ...componentsToUse, ...componentsToRemove }
    if (command === 'deploy') trackDeployment(componentsToUse)
    const graph = await buildGraph(componentsToUse, componentsToRemove, command)
    await executeGraph(graph, components, stateFile, archive, command, options, false)
  } catch (error) {
    if (reporter) { reporter.captureException(error) }
    log(chalk.red(`Error: ${error.message}. Rolling back...`))
    const executedComponents = getExecutedComponents(components)
    const executedComponentsGraph = await buildGraph(executedComponents, {}, command)
    await executeGraph(
      executedComponentsGraph,
      executedComponents,
      stateFile,
      archive,
      command,
      options,
      true
    )
    stateFile = archive
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
