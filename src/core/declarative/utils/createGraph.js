const { Graph, alg } = require('graphlib')
const { reduce } = require('../../../utils')
const { ROOT_NODE_NAME } = require('../constants')
const { types } = require('./variables')

function createGraph(componentsToRun, componentsToRemove, variableObjects) {
  let dag = new Graph()

  // reduce over all the variables and add the corresponding
  // instances and their dependencies to the graph
  dag = reduce(
    (accum, object) => {
      const { instanceId, type } = object
      // only add component types to the dag
      if (type === types.component) {
        const dependencyId = object.value.split('.')[0]
        accum.setNode(instanceId)
        accum.setNode(dependencyId)
        accum.setEdge(instanceId, dependencyId)
      }
      return accum
    },
    dag,
    variableObjects
  )

  // reduce over all the components we run and add all instances to the graph
  dag = reduce(
    (accum, instanceId) => {
      accum.setNode(instanceId, 'default')
      return accum
    },
    dag,
    Object.keys(componentsToRun)
  )

  // check if there are components which should be removed
  if (componentsToRemove && Object.keys(componentsToRemove).length) {
    dag = reduce(
      (accum, instanceId) => {
        accum.setNode(instanceId, 'remove')
        return accum
      },
      dag,
      Object.keys(componentsToRemove)
    )
  }

  // create a `root` node and add all nodes which are not dependent on other nodes
  // this `root` node will be used to walk the graph later on
  dag.setNode(ROOT_NODE_NAME)
  dag = reduce(
    (accum, instanceId) => {
      if (instanceId !== ROOT_NODE_NAME) {
        accum.setEdge(instanceId, ROOT_NODE_NAME)
      }
      return accum
    },
    dag,
    dag.sinks()
  )

  // checking for circular dependencies
  const isAcyclic = alg.isAcyclic(dag)
  if (!isAcyclic) {
    const cycles = alg.findCycles(dag)
    let msg = ['Your serverless.yml file has circular dependencies:']
    cycles.forEach((cycle, index) => {
      let fromAToB = cycle.join(' --> ')
      fromAToB = `${(index += 1)}. ${fromAToB}`
      const fromBToA = cycle.reverse().join(' <-- ')
      const padLength = fromAToB.length + 4
      msg.push(fromAToB.padStart(padLength))
      msg.push(fromBToA.padStart(padLength))
    }, cycles)
    msg = msg.join('\n')
    throw new Error(msg)
  }

  return dag
}

module.exports = createGraph
