import { Graph } from 'graphlib'
import { forEach } from '@serverless/utils'

const removeGraph = (graph, startingInstanceId, context) => {
  // get ordered list of nodes that "depend on" others using preorder traversal
  // hmm that wouldn't execute in parallel though, which is why I reverted to
  //  the "sinks & leaves" strategy in the previous implementation
  const instancesToRemove = Graph.alg.preorder(graph, startingInstanceId)

  forEach(async (node) => {
    if (['remove', 'replace'].includes(node.operation)) {
      await node.prevInstance.deploy(node.prevInstance, context) // do we pass prevInstance in that case?! or the one prev to that?
    }
  }, instancesToRemove)
}

export default removeGraph
