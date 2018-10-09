import { isEmpty } from '@serverless/utils'
import { handleSignalEvents, setKey, buildGraph, deployGraph, removeGraph } from '../../utils'

const createInstance = async (context) => {
  let instance = await context.construct(context.project.Type)
  instance = setKey('$', instance)

  // NOTE BRN: instance gets defined based on serverless.yml and type code
  instance = context.defineComponent(instance)

  return instance
}

const loadInstanceFromState = async (context) => {
  // WARNING BRN: this is the newer type. It is possible that this code has changed so much from the prev deployment that it's not possible to build an accurate represention of what was deployed. Could cause issues. Need a way to reconcile this eventually. Perhaps packaging up the project on each deployment and storing it away for use in this scenario (along with the config that was used to perform the deployment).
  let instance
  if (!isEmpty(context.state)) {
    instance = await context.construct(context.project.Type, {})
    instance = setKey('$', instance)
    // NOTE BRN: instance gets defined based on what was stored into state
    instance = await context.defineComponentFromState(instance)
  }
  return instance
}

const Deploy = {
  async run(context) {
    context.log('Deploy run executing - context:', context)

    // TODO BRN (low priority): Add programmatic support for programmatically supplying the contents of serverless.yml. When programmatically supplied, we should use defType instead of loadType to get the Project type

    context = await context.loadProject()
    context = await context.loadApp()

    const prevContext = await context.loadPreviousDeployment()
    const nextContext = await context.createDeployment(prevContext.deployment)

    // TODO BRN (low priority): Upgrade this signal handling so that we can tie in a handler that knows what to do when a SIGINT is received. In the case of deploy we may want to ignore the first one and log out the message, then if we receive anther one we stop the current deployment and start a rollback
    handleSignalEvents(context)

    // TODO BRN (low priority): inputs to the top level might be a way to inject project/deployment config

    const prevInstance = await loadInstanceFromState(prevContext)
    const nextInstance = await createInstance(nextContext)

    const graph = buildGraph(nextInstance, prevInstance)

    await deployGraph(graph, nextContext)
    await removeGraph(graph, prevContext) // nextInstance is the starting point, right?!

    // TODO BRN (high priority): build a deployment graph based upon the prevInstance and the nextInstance. Please note that all of the code in the "utils/dag" will need to be refactored based upon the following instructions. Please also update it to use imports/exports as we do in the rest of the utils folders.
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
    //  2. add all children in the nextInstance children tree to the graph as nodes. You can do this by using the walkReduceComponentDepthFirst method and passing the graph along as the accumulator.
    //    - walkReduceComponentDepthFirst on nextInstance
    //    - for each child add the child as the nextInstance and the child's id as the instanceId on the node
    //    - call `shouldDeploy` to retrieve the operation that is meant to be performed on that node, add the operation returned from shouldDeploy to the node. If undefined is returned from shouldDeploy, it means no operation should be performed on that node.
    //    - Note that there is a special "replace" operation returned from shouldDeploy. If "replace" is received it means that the node should be both removed and deployed.
    //    - Building the edges...
    //      - Add an edge from the current node to each of its children. You can access an instance's children using the `instance.children` property. There is a getChildrenIds convenience mechanism for this
    //      - Adding edges for variable references is a bit more complicated. Ealk through the properties of the current instance and identify variables using the isVariable function.
    //
    //    - return the graph as the accumulator
    //
    //  3. walkReduceComponentDepthFirst on the prevInstance tree
    //    - as you walk through each instance on the tree, load the corresponding node from the graph and set the prevInstance property on the node.
    //    - If the node does not exist on the graph, it means the node needs to be removed. Add the node to the graph. Set the prevInstance property, the instanceId and the operation to "remove". Also add an edge from the instances parent to the child that will be removed. You can access a child's parent using the `instance.parent` property
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

    // Deployment complete!

    // NOTE BRN: state is saved when saveState is called by each function. No need to call it here.

    // Run the info command against the nextInstance project

    return context
  }
}

export default Deploy
