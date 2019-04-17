/*
 * Component Declarative
 * - Use Serverless Components without JS
 */

const path = require('path')
const Component = require('../component/serverless')
const { readFile } = require('../../utils')
const { ROOT_NODE_NAME } = require('./constants')
const variables = require('./utils/variables')
const { getComponents, prepareComponents, createGraph, logOutputs, loadState } = require('./utils')

class ComponentDeclarative extends Component {
  /*
   * Default
   * - Loads serverless.yml and deploys all Components in it
   */

  async default() {
    this.cli.status('Running')

    let fileContent
    fileContent = await readFile(path.join(this.context.root, this.context.rootFile))

    // construct variable objects and resolve them (if possible)
    const vars = variables.constructObjects(fileContent)

    fileContent = variables.resolveServerlessFile(fileContent, vars)
    const configComponents = getComponents(fileContent)

    // TODO: refactor so that we don't need to pass `this` into it
    const componentsToRun = await prepareComponents(configComponents, this)

    // TODO: re-implement component auto-removal
    const componentsToRemove = {}
    const components = { ...componentsToRun, ...componentsToRemove }

    const graph = createGraph(componentsToRun, componentsToRemove, vars)

    const results = {}
    const outputs = {}
    const usedComponents = []

    const rootPredecessors = graph.predecessors(ROOT_NODE_NAME)
    const predecessors = new Set([...rootPredecessors])

    while (predecessors.size) {
      await Promise.all(
        [...predecessors].map(async (instanceId) => {
          if (!instanceId) {
            return
          }
          const value = components[instanceId]

          // If component instance was not found, the variable is for an invalid instance
          if (!value) {
            throw new Error(
              `Invalid variable detected: 'comp:${instanceId}'  Component instance '${instanceId}' does not exist in this configuration file.`
            )
          }

          let inputs = value.inputs // eslint-disable-line
          const { component, instance } = value
          inputs = variables.resolveComponentVariables(vars, results, value)
          // remove own insance from predecessors set
          predecessors.delete(instanceId)
          // add new predecessors to set (if any)
          const nodePredecessors = graph.predecessors(instanceId)
          if (nodePredecessors.length) {
            nodePredecessors.forEach((pred) => predecessors.add(pred))
          }
          const operation = graph.node(instanceId)
          const res = await instance[operation](inputs)
          results[instanceId] = res
          outputs[instanceId] = res
          // push information about used component (used in the the components state data)
          usedComponents.push({
            instanceId,
            component,
            stateFileName: `${instance.id}.json`
          })
          return {
            [instanceId]: outputs
          }
        })
      )
    }

    this.state = { components: usedComponents }
    await this.save()

    logOutputs(this.cli, outputs)
  }

  /*
   * Remove
   * - Removes all Components in serverless.yml
   */

  async remove() {
    this.cli.status('Removing')

    let fileContent
    fileContent = await readFile(path.join(this.context.root, this.context.rootFile))

    // construct variable objects and resolve them (if possible)
    const vars = variables.constructObjects(fileContent)
    fileContent = variables.resolveServerlessFile(fileContent, vars)
    const configComponents = getComponents(fileContent)

    // TODO: refactor so that we don't need to pass `this` into it
    const componentsToRun = await prepareComponents(configComponents, this)
    const componentsToRemove = {}

    const components = { ...componentsToRun, ...componentsToRemove }
    const graph = createGraph(componentsToRun, componentsToRemove, vars)

    const state = await loadState(this.state)
    const outputs = {}

    const sources = graph.sources()
    const successors = new Set([...sources])
    while (successors.size) {
      await Promise.all(
        [...successors].map(async (instanceId) => {
          if (!instanceId) {
            return
          }
          const value = components[instanceId]
          let inputs = value.inputs // eslint-disable-line
          const { instance } = value
          inputs = variables.resolveComponentVariables(vars, state, value)
          // remove own insance from successors set
          successors.delete(instanceId)
          // add new successors to set (if any)
          const nodePredecessors = graph.successors(instanceId)
          if (nodePredecessors.length) {
            nodePredecessors.forEach((succ) => {
              if (succ !== ROOT_NODE_NAME) {
                successors.add(succ)
              }
            })
          }
          const res = await instance.remove(inputs)
          outputs[instanceId] = res
          return {
            [instanceId]: outputs
          }
        })
      )
    }

    this.state = {}
    await this.save()

    logOutputs(this.cli, outputs)
  }
}

module.exports = ComponentDeclarative
