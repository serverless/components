const Graph = require('graphlib').Graph
const AWS = require('aws-sdk')
const path = require('path')
const R = require('ramda')
const BbPromise = require('bluebird')
const utils = require('./utils')

const { readFile, fileExists, writeFile } = utils
const { reduce, mergeDeepRight, forEachObjIndexed, mapObjIndexed, is, isEmpty, keys, map, contains, not, test, match, replace, forEach } = R

const components = {
  'github-webhook-receiver': {
    type: 'github-webhook-receiver@0.0.1',
    inputs: {},
    outputs: {},
    fn: async (inputs) => {
      console.log('github-webhook-receiver')
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
  }
}

const getComponents = async (componentRoot = process.cwd(), inputs = {}, componentId, components = {}) => {
  const slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))
  inputs = mergeDeepRight(slsYml.inputs || {}, inputs)
  if (!componentId) {
    componentId = slsYml.name
  }

  const nestedComponents = await reduce(async (accum, componentAlias) => {
    accum = await Promise.resolve(accum)
    const componentRoot = path.join(process.cwd(), '..', 'registry', slsYml.components[componentAlias].type)
    const componentInputs = slsYml.components[componentAlias].inputs
    const nestedComponentId = `${componentId}:${componentAlias}`
    accum = await getComponents(componentRoot, componentInputs, nestedComponentId, accum)
    return accum
  }, Promise.resolve(components), keys(slsYml.components) || [])

  // console.log(nestedComponents)

  components[componentId] = {
    inputs,
    outputs: {},
    fn: require(path.join(componentRoot, 'index.js'))
  }
  components = {...components, ...nestedComponents}
  return components
}

const getGraph = async () => {
  const graph = {
    nodes: new Graph(),
    data: await getComponents()
  }

  // console.log(graph.data)

  // forEach((componentId) => {
  //   graph.nodes.setNode(componentId)
  // }, keys(components))
  //
  // forEachObjIndexed((componentData, componentId) => {
  //   if (not(isEmpty(componentData.dependencies))) {
  //     forEach((dependencyId) => {
  //       graph.nodes.setEdge(componentId, dependencyId)
  //     }, componentData.dependencies)
  //   }
  // }, components)
  return graph
}

const executeComponent = async (componentId, graph) => {
  const component = graph.data[componentId]
  components[componentId].outputs = await component.fn(component.inputs)
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
  console.log(graph.data)
  // return execute(graph)
}

module.exports = {
  Components,
  AWS,
  BbPromise,
  ...utils
}
