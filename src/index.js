const BbPromise = require('bluebird')
const utils = require('./utils')

const {
  getComponents, buildGraph, executeGraph, readStateFile, updateStateFile
} = utils

const run = async (command, options) => {
  let components = {}
  try {
    const stateFile = await readStateFile()
    components = await getComponents(stateFile)
    const graph = await buildGraph(components)
    await executeGraph(graph, components, command, options)
  } catch (error) {
    return BbPromise.reject(error)
  } finally {
    await updateStateFile(components)
    return components // eslint-disable-line no-unsafe-finally
  }
}

module.exports = {
  ...utils,
  run
}
