import { Graph } from 'graphlib'
import { all, map } from '@serverless/utils'

const removeGraph = (graph, startingInstanceId, context) => {
  // get ordered list of nodes that "depend on" others using preorder traversal
  // hmm that wouldn't execute in parallel though, which is why I reverted to
  //  the "sinks & leaves" strategy in the previous implementation
  const instancesToRemove = Graph.alg.preorder(graph, startingInstanceId)

  // todo use map series
  return all(
    map(async (node) => {
      if (['remove', 'replace'].includes(node.operation)) {
        await node.prevInstance.remove(context)
      }
    }, instancesToRemove)
  )
}

export default removeGraph
