const { mergeDeepRight } = require('../../src/utils')
const Component = require('../Component/serverless')

const {
  loadServerlessFile,
  prepareComponents,
  createGraph,
  loadState,
  logOutputs
} = require('./utils')
const variables = require('./utils/variables')

const defaults = {
  path: process.cwd()
}

class Components extends Component {
  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)

    let fileContent
    fileContent = await loadServerlessFile(config.path)

    // construct variable objects and resolve them (if possible)
    const vars = variables.constructObjects(fileContent)
    fileContent = variables.resolveServerlessFile(fileContent, vars)

    // TODO: refactor so that we don't need to pass `this` into it
    const preparedComponents = prepareComponents(fileContent.components, this)

    const graph = createGraph(preparedComponents, vars)

    this.cli.status(`${Object.keys(preparedComponents).length} Components Loaded`)

    // TODO: update to process nodes in parallel
    const results = {}
    const outputs = {}
    const instancesToProcess = graph.overallOrder()
    for (let i = 0; i < instancesToProcess.length; i++) {
      const instanceId = instancesToProcess[i]
      const value = preparedComponents[instanceId]
      let inputs = value.inputs // eslint-disable-line
      const { component, instance } = value
      inputs = variables.resolveComponentVariables(vars, results, value)
      this.cli.status(`Running ${component} "${instanceId}"`)
      const result = await instance.default(inputs)
      results[instanceId] = result
      outputs[instanceId] = instance.cli.outputs
    }

    logOutputs(this.cli, outputs)
  }

  async remove(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)

    let fileContent
    fileContent = await loadServerlessFile(config.path)

    // construct variable objects and resolve them (if possible)
    const vars = variables.constructObjects(fileContent)
    fileContent = variables.resolveServerlessFile(fileContent, vars)

    // TODO: refactor so that we don't need to pass `this` into it
    const preparedComponents = prepareComponents(fileContent.components, this)

    // TODO: refactor so that we don't need to manually create the ids
    const ids = Object.keys(preparedComponents).map((componentId) => `${this.id}.${componentId}`)
    const state = loadState(ids)

    const graph = createGraph(preparedComponents, vars)

    this.cli.status(`${Object.keys(preparedComponents).length} Components Loaded`)

    // TODO: update to process nodes in parallel
    const results = {}
    const outputs = {}
    const instancesToProcess = graph.overallOrder().reverse()
    for (let i = 0; i < instancesToProcess.length; i++) {
      const instanceId = instancesToProcess[i]
      const value = preparedComponents[instanceId]
      let inputs = value.inputs // eslint-disable-line
      const { component, instance } = value
      inputs = variables.resolveComponentVariables(vars, state, value)
      this.cli.status(`Running ${component} "${instanceId}"`)
      const result = await instance.remove(inputs)
      results[instanceId] = result
      outputs[instanceId] = instance.cli.outputs
    }

    logOutputs(this.cli, outputs)
  }
}

module.exports = Components
