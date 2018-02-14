const Graph = require('graphlib').Graph
const path = require('path')
const R = require('ramda')
const BbPromise = require('bluebird')
const utils = require('./utils')

const { readFile, writeFile, fileExists } = utils
const { reduce, mergeDeepRight, isEmpty, map, reject, isNil, keys, forEach, forEachObjIndexed, not, is, test, replace, contains, match } = R

const normalizeInputs = (inputs, componentId) => {
  const regex = RegExp('\\${([ ~:a-zA-Z0-9._\'",\\-\\/\\(\\)]+?)}', 'g') // eslint-disable-line
  const normalizeInput = (input) => {
    if (is(Object, input) || is(Array, input)) {
      return map(normalizeInput, input)
    }

    if (is(String, input) && test(regex, input)) {
      const referencedOutput = replace(/[${}]/g, '', match(regex, input)[0]) // todo support multiple matches in single value?
      if (referencedOutput.split(':').length === 1) {
        return input
      }
      const referencedComponentAlias = referencedOutput.split(':')[0]
      const referencedOutputKey = referencedOutput.split(':')[1] // todo support deep nested outputs?

      return `\${${componentId}:${referencedComponentAlias}:${referencedOutputKey}}`
    }
    return input
  }

  return map(normalizeInput, inputs)
}

const getComponents = async (componentRoot = process.cwd(), inputs = {}, componentId, components = {}) => {
  const slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))
  if (!componentId) {
    componentId = slsYml.type
  }
  let inlineInputs = slsYml.inputs || {}
  inlineInputs = normalizeInputs(inlineInputs, componentId)

  let parentInputs = inputs
  const relativeComponentId = componentId.split(':')
  relativeComponentId.splice(-1, 1)
  parentInputs = normalizeInputs(parentInputs, relativeComponentId)

  inputs = mergeDeepRight(inlineInputs, parentInputs)

  const nestedComponents = await reduce(async (accum, componentAlias) => {
    accum = await Promise.resolve(accum)
    const componentRoot = path.join(process.cwd(), '..', '..', 'registry', slsYml.components[componentAlias].type)
    const componentInputs = slsYml.components[componentAlias].inputs
    const nestedComponentId = `${componentId}:${componentAlias}`
    accum = await getComponents(componentRoot, componentInputs, nestedComponentId, accum)
    return accum
  }, Promise.resolve(components), keys(slsYml.components) || [])

  let fn
  if (await fileExists(path.join(componentRoot, 'index.js'))) {
    fn = require(path.join(componentRoot, 'index.js'))
  } else {
    fn = () => ({})
  }
  components[componentId] = {
    inputs,
    outputs: {},
    fn
  }
  components = {...components, ...nestedComponents}
  return components
}

const readStateFile = async () => {
  const stateFilePath = path.join(process.cwd(), 'state.json')

  if (!await fileExists(stateFilePath)) {
    return {}
  }
  const state = await readFile(stateFilePath)
  return state
}

const writeStateFile = async (state) => {
  const stateFilePath = path.join(process.cwd(), 'state.json')
  return writeFile(stateFilePath, state)
}

const getDependencies = (inputs) => {
  const regex = RegExp('\\${([ ~:a-zA-Z0-9._\'",\\-\\/\\(\\)]+?)}', 'g') // eslint-disable-line

  const dependencies = map((inputKey) => {
    if (is(String, inputs[inputKey]) && test(regex, inputs[inputKey])) {
      const referencedOutput = replace(/[${}]/g, '', match(regex, inputs[inputKey])[0]) // todo support multiple matches in single value?
      if (referencedOutput.split(':').length === 1) {
        return null // env var
      }
      let referencedComponentId = referencedOutput.split(':')
      referencedComponentId.splice(-1, 1)
      referencedComponentId = referencedComponentId.join(':')
      return referencedComponentId
    }
    return null
  }, keys(inputs))

  return reject(isNil, dependencies)
}

const getGraph = async () => {
  const graph = {
    nodes: new Graph(),
    data: await getComponents(),
    state: await readStateFile()
  }

  forEach((componentId) => {
    graph.nodes.setNode(componentId)
  }, keys(graph.data))

  forEachObjIndexed((component, componentId) => {
    component.dependencies = getDependencies(component.inputs)
    if (not(isEmpty(component.dependencies))) {
      forEach((dependencyId) => {
        graph.nodes.setEdge(componentId, dependencyId)
      }, component.dependencies)
    }
  }, graph.data)
  return graph
}

const getDependenciesOutputs = (componentId, graph) => {
  const component = graph.data[componentId]
  return reduce((accum, dependencyId) => {
    accum[dependencyId] = graph.data[dependencyId].outputs
    return accum
  }, {}, component.dependencies)
}

const resolveOutputReferences = (inputs, outputs) => {
  const regex = RegExp('\\${([ ~:a-zA-Z0-9._\'",\\-\\/\\(\\)]+?)}', 'g') // eslint-disable-line

  const resolveValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(resolveValue, value)
    }

    if (is(String, value) && test(regex, value)) {
      const referencedOutput = replace(/[${}]/g, '', match(regex, value)[0]) // todo support multiple matches in single value?
      if (referencedOutput.split(':').length === 1) {
        return process.env[referencedOutput]
      }
      let referencedComponentId = referencedOutput.split(':')
      const referencedOutputKey = referencedComponentId.pop()
      referencedComponentId = referencedComponentId.join(':')

      if (not(contains(referencedComponentId, keys(outputs)))) {
        throw new Error(`Component "${referencedComponentId}" does not exist or has not yet been provisioned`)
      }
      if (not(contains(referencedOutputKey, keys(outputs[referencedComponentId])))) {
        throw new Error(`Component "${referencedComponentId}" does not output "${referencedOutputKey}"`)
      }
      return outputs[referencedComponentId][referencedOutputKey]
    }
    return value
  }
  return map(resolveValue, inputs)
}

const runCommand = async (command, graph) => {
  const slsYml = await readFile(path.join(process.cwd(), 'serverless.yml'))
  const state = graph.state[slsYml.type]
  const commandLogicPath = path.join(process.cwd(), `${command}.js`)

  if (!await fileExists(commandLogicPath)) {
    throw new Error(`Command ${command} does not exist`)
  }

  const commandLogic = require(commandLogicPath)

  return commandLogic(state)
}

const executeComponent = async (componentId, graph, remove = false) => {
  const component = graph.data[componentId]
  const dependenciesOutputs = getDependenciesOutputs(componentId, graph)
  const inputs = resolveOutputReferences(component.inputs, dependenciesOutputs)
  component.outputs = await component.fn(remove ? {} : inputs, graph.state[componentId] || {})
  graph.state[componentId] = mergeDeepRight(inputs, component.outputs)
  if (remove) graph.state[componentId] = {}
  graph.nodes.removeNode(componentId)
}

const execute = async (graph, command) => {
  if (command === 'deploy' || command === 'remove') {
    const leaves = graph.nodes.sinks()

    if (isEmpty(leaves)) {
      return graph.data
    }

    await BbPromise.all(map((componentId) => executeComponent(componentId, graph, command === 'remove'), leaves))

    return execute(graph, command)
  }
  return runCommand(command, graph)
}

const provision = async (command) => {
  const graph = await getGraph()
  await execute(graph, command)
  return writeStateFile(graph.state)
}

module.exports = {
  provision,
  runCommand,
  ...utils
}
