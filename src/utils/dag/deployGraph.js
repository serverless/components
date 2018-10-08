import { Graph } from 'graphlib'
import { forEach } from '@serverless/utils'

const deployGraph = (graph, startingInstanceId, context) => {
  // get ordered list of nodes that are "dependend upon" by others using postorder traversal
  // hmm that wouldn't execute in parallel though, which is why I reverted to
  //  the "sinks & leaves" strategy in the previous implementation
  const instancesToDeploy = Graph.alg.postorder(graph, startingInstanceId)

  forEach(async (node) => {
    if (['deploy', 'replace'].includes(node.operation)) {
      await node.nextInstance.deploy(node.prevInstance, context)
    }
  }, instancesToDeploy)
}

export default deployGraph
