const Graph = require('graphlib').Graph
const AWS = require('aws-sdk')
const path = require('path')
const R = require('ramda')
const BbPromise = require('bluebird')
const utils = require('./utils')

const { readFile } = utils
const { reduce, mergeDeepRight, isEmpty, map, reject, isNil, keys, forEach, forEachObjIndexed, not, is, test, replace, contains, match } = R
/*
 * dynamodb
 *
 * github-webhook
 *   |- apigateway
 *     |- apig-iam
 *     |- lambda
 *       |- lambda-iam
 *
 */
const components = {
  'github-webhook-receiver:dynamodb': {
    type: 'dynamodb@0.0.1',
    inputs: {},
    outputs: {},
    fn: async (inputs) => {
      console.log('dynamodb')
      await BbPromise.delay(1000)
    },
    dependencies: []
  },
  'github-webhook-receiver:lambda': {
    type: 'lambda@0.0.1',
    inputs: {
      name: 'lambda',
      memory: 128,
      timeout: 10,
      handler: 'code.handler',
      role: '${github-webhook-receiver:lambda:iam.arn}'
    },
    outputs: {},
    fn: async (inputs) => {
      console.log('github-webhook-receiver:lambda')
      await BbPromise.delay(1000)
    },
    dependencies: ['github-webhook-receiver:lambda:iam']
  },
  'github-webhook-receiver:lambda:iam': {
    type: 'iam@0.0.1',
    inputs: {
      name: 'lambda-role'
    },
    fn: async (inputs) => {
      console.log('github-webhook-receiver:lambda:iam')
      await BbPromise.delay(5000)
    },
    outputs: {},
    dependencies: []
  },
  'github-webhook-receiver:apig:iam': {
    type: 'iam@0.0.1',
    inputs: {
      name: 'apig-role'
    },
    outputs: {},
    fn: async (inputs) => {
      console.log('github-webhook-receiver:apig:iam')
      await BbPromise.delay(5000)
    },
    dependencies: []
  },
  'github-webhook-receiver:apig': {
    type: 'apigateway@0.0.1',
    inputs: {
      name: 'apig',
      method: 'post',
      path: '/webhook',
      lambda: '${github-webhook-receiver:lambda.arn}',
      role: '${github-webhook-receiver:apig:iam.arn}'
    },
    outputs: {},
    fn: async (inputs) => {
      console.log('github-webhook-receiver:apig')
      await BbPromise.delay(1000)
    },
    dependencies: ['github-webhook-receiver:lambda', 'github-webhook-receiver:apig:iam']
  },
  'github-webhook-receiver:github': {
    type: 'github@0.0.1',
    inputs: {
    },
    outputs: {},
    fn: async (inputs) => {
      console.log('github-webhook')
      await BbPromise.delay(1000)
    },
    dependencies: ['github-webhook-receiver:apig']
  }
}

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
    componentId = slsYml.name
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
    const componentRoot = path.join(process.cwd(), '..', 'registry', slsYml.components[componentAlias].type)
    const componentInputs = slsYml.components[componentAlias].inputs
    const nestedComponentId = `${componentId}:${componentAlias}`
    accum = await getComponents(componentRoot, componentInputs, nestedComponentId, accum)
    return accum
  }, Promise.resolve(components), keys(slsYml.components) || [])

  components[componentId] = {
    inputs,
    outputs: {},
    fn: require(path.join(componentRoot, 'index.js'))
  }
  components = {...components, ...nestedComponents}
  return components
}

const getDependencies = (inputs) => {
  const regex = RegExp('\\${([ ~:a-zA-Z0-9._\'",\\-\\/\\(\\)]+?)}', 'g') // eslint-disable-line

  const dependencies = map((inputKey) => {
    // console.log(inputs[inputKey])
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
    data: await getComponents()
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

const executeComponent = async (componentId, graph) => {
  const component = graph.data[componentId]
  component.outputs = await component.fn(component.inputs)
  graph.nodes.removeNode(componentId)
}

const execute = async (graph) => {
  const leaves = graph.nodes.sinks()

  if (isEmpty(leaves)) {
    return graph.data
  }

  await BbPromise.all(map((componentId) => executeComponent(componentId, graph), leaves))

  return execute(graph)
}

const Components = async () => {
  const graph = await getGraph(components)
  return execute(graph)
}

module.exports = {
  Components,
  AWS,
  BbPromise,
  ...utils
}
