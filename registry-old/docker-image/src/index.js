const {
  checkDockerSetup,
  buildImage,
  login,
  pushImage,
  logout,
  removeImage,
  getToken,
  deleteImage
} = require('./utils')

// "public" functions
async function build(inputs, context) {
  const { tag } = inputs

  await checkDockerSetup()

  context.log(`Building Docker image based on "${inputs.dockerfilePath}"...`)

  await buildImage(inputs.dockerfilePath, inputs.tag, inputs.contextPath)

  const outputs = { tag }
  const state = { ...inputs }
  delete state.username
  delete state.password
  context.saveState(state)

  context.log(`Image successfully built with tag "${tag}"`)

  return outputs
}

async function deploy(inputs, context) {
  // build if we don't have state yet (haven't run `build` before)
  if (Object.keys(context.state).length === 0) {
    await build(inputs, context)
  }

  const { username, password, tag, registryUrl } = inputs

  await checkDockerSetup()

  context.log(`Pushing Docker image to registry "${registryUrl}"...`)

  await login(username, password, registryUrl)
  await pushImage(tag)
  await logout(registryUrl)

  const outputs = { tag }
  const state = { ...inputs }
  delete state.username
  delete state.password
  context.saveState(state)

  context.log(`Image successfully pushed to registry "${registryUrl}"`)

  return outputs
}

async function remove(inputs, context) {
  const { username, password } = inputs
  const { tag, registryUrl } = context.state

  await checkDockerSetup()

  context.log(`Removing Docker image "${tag}" locally...`)
  await removeImage(tag)

  context.log(`Removing Docker image "${tag}" from registry "${registryUrl}"...`)
  const token = await getToken(username, password, registryUrl)
  await deleteImage(token, tag, registryUrl)

  context.saveState()
  return {}
}

module.exports = {
  build,
  deploy,
  remove
}
