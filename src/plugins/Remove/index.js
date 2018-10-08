const Remove = {
  async run(context) {
    context = await context.loadProject()
    context = await context.loadApp()
    const { app } = context
    const lastDeployment = await app.loadLastDeployment()
    const lastContext = await context.loadState(lastDeployment)

    let project = await lastContext.construct(project.Type, {})
    project = await context.defineFromState(project)

    // TODO BRN (low priority): Upgrade this signal handling so that we can tie in a handler that knows what to do when a SIGINT is received. In the case of deploy we may want to ignore the first one and log out the message, then if we receive anther one we stop the current deployment and start a rollback
    handleSignalEvents(context)

    context.log('TODO: implement remove command')
    return context
  }
}

export default Remove
