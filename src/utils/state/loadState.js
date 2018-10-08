const loadState = (deployment) => {
  const { app, id } = deployment
  const { project } = app
  const stateFilePath = join(
    project.path,
    '.serverless',
    'apps',
    app.id,
    'deployments',
    id,
    'state.json'
  )

  // TODO BRN
}

export default loadState
