const Graph = require('graphlib').Graph
const path = require('path')
const R = require('ramda')
const BbPromise = require('bluebird')
const utils = require('./utils')

const { readFile, fileExists, readStateFile, writeStateFile } = utils
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

const resolveParentInputReferences = (parentInputs, inputReferences) => {
  const regex = RegExp('\\${([ ~:a-zA-Z0-9._\'",\\-\\/\\(\\)]+?)}', 'g') // eslint-disable-line

  const resolveValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(resolveValue, value)
    }

    if (is(String, value) && test(regex, value)) {
      const referencedInput = replace(/[${}]/g, '', match(regex, value)[0]) // todo support multiple matches in single value?
      if (referencedInput.split(':')[0] !== 'parent') {
        return value
      }
      let referencedParentInput = referencedInput.split(':')[1]

      if (not(contains(referencedParentInput, keys(parentInputs)))) {
        throw new Error(`Parent inputs does not contain "${referencedParentInput}"`)
      }
      return parentInputs[referencedParentInput]
    }
    return value
  }
  return map(resolveValue, inputReferences)
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
  parentInputs = normalizeInputs(parentInputs, relativeComponentId.join(':'))

  inputs = mergeDeepRight(inlineInputs, parentInputs)

  const nestedComponents = await reduce(async (accum, componentAlias) => {
    accum = await Promise.resolve(accum)
    const componentRoot = path.join(__dirname, '..', 'registry', slsYml.components[componentAlias].type)
    let componentInputs = slsYml.components[componentAlias].inputs
    componentInputs = resolveParentInputReferences(inputs, componentInputs)
    const nestedComponentId = `${componentId}:${componentAlias}`
    accum = await getComponents(componentRoot, componentInputs, nestedComponentId, accum)
    return accum
  }, Promise.resolve(components), keys(slsYml.components) || [])

  let fns = {}
  if (await fileExists(path.join(componentRoot, 'index.js'))) {
    fns = require(path.join(componentRoot, 'index.js'))
  }

  components[componentId] = {
    inputs,
    outputs: {},
    fns
  }
  components = {...components, ...nestedComponents}
  return components
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

const executeComponent = async (componentId, graph, command, options) => {
  const component = graph.data[componentId]
  const state = graph.state[componentId] || {}
  let inputs
  if (command === 'deploy' || command === 'remove') {
    const dependenciesOutputs = getDependenciesOutputs(componentId, graph)
    inputs = resolveOutputReferences(component.inputs, dependenciesOutputs)
  } else {
    inputs = state
  }
  if (typeof component.fns[command] === 'function') {
    component.outputs = (await component.fns[command](inputs, state, utils, options)) || {}
  }
  graph.state[componentId] = mergeDeepRight(inputs, component.outputs || {})
  if (command === 'remove') graph.state[componentId] = {}
  graph.nodes.removeNode(componentId)
}

const execute = async (graph, command, options) => {
  const leaves = graph.nodes.sinks()

  if (isEmpty(leaves)) {
    return graph.data
  }

  await BbPromise.all(map((componentId) => executeComponent(componentId, graph, command, options), leaves))

  return execute(graph, command)
}

module.exports = async (command, options) => {
  const graph = await getGraph()
  await execute(graph, command, options)
  return writeStateFile(graph.state)
}
