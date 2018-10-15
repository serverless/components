import { handleSignalEvents, buildGraph, removeGraph } from '../../utils'

const Remove = {
  async run(context) {
    context.log('Remove run executing - context:', context)

    // TODO BRN (low priority): Add programmatic support for programmatically supplying the contents of serverless.yml. When programmatically supplied, we should use defType instead of loadType to get the Project type

    context = await context.loadProject()
    context = await context.loadApp()

    const prevContext = await context.loadPreviousDeployment()

    // TODO BRN (low priority): Upgrade this signal handling so that we can tie in a handler that knows what to do when a SIGINT is received. In the case of deploy we may want to ignore the first one and log out the message, then if we receive anther one we stop the current deployment and start a rollback
    handleSignalEvents(context)

    // TODO BRN (low priority): inputs to the top level might be a way to inject project/deployment config

    const prevInstance = await prevContext.loadInstanceFromState()

    const graph = buildGraph(null, prevInstance)

    await removeGraph(graph, prevContext)

    // Removal complete!

    // NOTE BRN: state is saved when saveState is called by each function. No need to call it here.

    return prevContext
  }
}

export default Remove
