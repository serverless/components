const { Graph } = require('graphlib')
const { reduce } = require('../../../utils')
const { ROOT_NODE_NAME } = require('../constants')
const { types } = require('./variables')

function createGraph(prepareComponents, variableObjects) {
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

  // reduce over all the components we've prepared based on
  // the serverless file and add all instances to the graph
  dag = reduce(
    (accum, instanceId) => {
      accum.setNode(instanceId)
      return accum
    },
    dag,
    Object.keys(prepareComponents)
  )

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

  // TODO: explicitly check for circular dependencies here
  // this is commented out since re-throwing the error won't cause
  // the CLI to pick it up and print the error message in red
  // // check for circular dependencies
  // try {
  //   dag.overallOrder()
  // } catch (error) {
  //   throw new Error(error.message)
  // }

  return dag
}

module.exports = createGraph
