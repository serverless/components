/*
* Component Declarative
* - Use Serverless Framework w/
*/

const path = require('path')
const Component = require('../component/serverless')
const { mergeDeepRight, readFile } = require('../../utils')
const {
  prepareComponents,
  createGraph,
  loadState,
  logOutputs,
} = require('./utils')
const variables = require('./utils/variables')

const defaults = {
  path: process.cwd()
}

class ComponentDeclarative extends Component {

  /*
  * Default
  * - Loads serverless.yml and deploys all Components in it
  */

  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)
    let fileContent
    fileContent = await readFile(path.join(this.context.root, this.context.rootFile))

    // construct variable objects and resolve them (if possible)
    const vars = variables.constructObjects(fileContent)
    fileContent = variables.resolveServerlessFile(fileContent, vars)

    // TODO: refactor so that we don't need to pass `this` into it
    const preparedComponents = prepareComponents(fileContent.components, this)
    const graph = createGraph(preparedComponents, vars)

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

      const result = await instance.default(inputs)
      results[instanceId] = result
      outputs[instanceId] = instance.cli.outputs
    }

    // Update CLI entity to be the name of the YAML Component
    // logOutputs(this.cli, outputs)
  }

  /*
  * Remove
  * - Removes all Components in serverless.yml
  */

  async remove(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)

    let fileContent
    fileContent = await readFile(path.join(this.context.root, this.context.rootFile))

    // construct variable objects and resolve them (if possible)
    const vars = variables.constructObjects(fileContent)
    fileContent = variables.resolveServerlessFile(fileContent, vars)

    // TODO: refactor so that we don't need to pass `this` into it
    const preparedComponents = prepareComponents(fileContent.components, this)

    // TODO: refactor so that we don't need to manually create the ids
    const ids = Object.keys(preparedComponents).map((componentId) => `${this.id}.${componentId}`)
    const state = loadState(ids)
    const graph = createGraph(preparedComponents, vars)

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

      // Update the CLI entity to the current component
      this.cli.entity(component)
      this.cli.status('removing...')

      const result = await instance.remove(inputs)
      results[instanceId] = result
      outputs[instanceId] = instance.cli.outputs
    }

    logOutputs(this.cli, outputs)
  }
}

module.exports = ComponentDeclarative
