import {
  buildGraph,
  deployGraph,
  findPluginForCommand,
  handleSignalEvents,
  removeGraph
} from '../../utils'

const Deploy = {
  async run(context) {
    // NOTE BRN: here we build a deployment graph based upon the prevInstance and the nextInstance.
    //
    //  Building the nodes of the graph
    //  1. each node in the graph should have a nextInstance, prevInstance, instanceId and operation properties
    //    - {
    //       prevInstance: [the component instance from the prevInstance tree],
    //       nextInstance: [the component instance from the nextInstance tree],
    //       instanceId: [the component's instanceId],
    //       operation: string (the operation to perform on the component)
    //    }
    //
    //  2. add all children in the nextInstance children tree to the graph as nodes. You can do this by using the walkReduceAllComponentsDepthFirst method and passing the graph along as the accumulator.
    //    - walkReduceAllComponentsDepthFirst on nextInstance
    //    - for each child add the child as the nextInstance and the child's id as the instanceId on the node
    //    - call `shouldDeploy` to retrieve the operation that is meant to be performed on that node, add the operation returned from shouldDeploy to the node. If undefined is returned from shouldDeploy, it means no operation should be performed on that node.
    //    - Note that there is a special "replace" operation returned from shouldDeploy. If "replace" is received it means that the node should be both removed and deployed.
    //    - Building the edges...
    //      - Add an edge from the current node to each of its children. You can access an instance's children using the `instance.children` property. There is a getChildrenIds convenience mechanism for this
    //      - Adding edges for variable references is a bit more complicated. Ealk through the properties of the current instance and identify variables using the isVariable function.
    //
    //    - return the graph as the accumulator
    //
    //  3. walkReduceAllComponentsDepthFirst on the prevInstance tree
    //    - as you walk through each instance on the tree, load the corresponding node from the graph and set the prevInstance property on the node.
    //    - If the node does not exist on the graph, it means the node needs to be removed. Add the node to the graph. Set the prevInstance property, the instanceId and the operation to "remove". Also add an edge from the instances parent to the child that will be removed. You can access a child's parent using the `instance.parent` property
    //
    // Deploying the Graph
    // We should execute the deployment of the graph in a few phases
    //  1. First execute all deploy operations.
    //    - traverse the graph and find nodes that have either a "deploy" operation or a "replace" operation
    //    - Deploy nodes that are "dependend upon" by others first.
    //    - If a "replace" is encountered, call deploy.
    //    - deploy should be called against the nextInstance value in the graph node
    //  2. Now execute all remove operations
    //    - Remove nodes that "depend on" others first
    //    - note the reverse order from deploy. This requires traversing the graph backward.
    //    - remove should be called against the "prevInstance" value of the graph node
    //    - If a "replace" is encountered, call remove() on the prevInstance value in the graph node.

    // TODO BRN (low priority): Add programmatic support for programmatically supplying the contents of serverless.yml. When programmatically supplied, we should use defType instead of loadType to get the Project type

    context.log('Deploy running...')
    context = await context.loadProject()
    context = await context.loadApp()
    context = await context.loadPreviousDeployment()
    context = await context.createDeployment()

    // TODO BRN (low priority): inputs to the top level might be a way to inject project/deployment config

    context = await context.loadPreviousInstance()
    context = await context.createInstance()

    const graph = buildGraph(context.instance, context.previousInstance)

    // TODO BRN (low priority): Upgrade this signal handling so that we can tie in a handler that knows what to do when a SIGINT is received. In the case of deploy we may want to ignore the first one and log out the message, then if we receive anther one we stop the current deployment and start a rollback
    handleSignalEvents(context)

    try {
      await deployGraph(graph, context)
      await removeGraph(graph, context)

      // Deployment complete!
      context.log('Deployment complete!')

      // Run info command
      const Info = findPluginForCommand('info', context)
      return Info.run(context)
    } catch (error) {
      context.log('Error occurred during deployment')
      context.log(error)
      // TODO BRN: we SHOULD rollback to the previous state here.
    } finally {
      // TODO BRN: In the event that we only do a partial deployment we need a path to recovery...
      await context.saveState()
    }

    return context
  }
}

export default Deploy
