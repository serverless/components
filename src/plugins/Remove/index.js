import { handleSignalEvents, buildGraph, removeGraph } from '../../utils'

const Remove = {
  async run(context) {
    // TODO BRN (low priority): Add programmatic support for programmatically supplying the contents of serverless.yml. When programmatically supplied, we should use defType instead of loadType to get the Project type

    context.log('Remove running...')
    context = await context.loadProject()
    context = await context.loadApp()
    context = await context.loadPreviousDeployment()
    context = await context.createRemovalDeployment()

    // TODO BRN (low priority): inputs to the top level might be a way to inject project/deployment config
    context = await context.loadPreviousInstance()
    context = await context.loadInstance()

    const graph = buildGraph(context.instance, context.previousInstance)

    // TODO BRN (low priority): Upgrade this signal handling so that we can tie in a handler that knows what to do when a SIGINT is received. In the case of deploy we may want to ignore the first one and log out the message, then if we receive anther one we stop the current deployment and start a rollback
    handleSignalEvents(context)

    try {
      await removeGraph(graph, context)
      context.log('Removal complete')
    } catch (error) {
      context.log('Error occurred during deployment')
      context.log(error)
      // TODO BRN: should we rollback to the previous state here?
    } finally {
      // TODO BRN: In the event that we only do a partial deployment we need a path to recovery...
      await context.saveState()
    }

    // Removal complete!
    return context
  }
}

export default Remove
