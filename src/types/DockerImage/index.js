import {
  checkDockerSetup,
  buildImage,
  login,
  pushImage,
  logout,
  removeImage,
  getToken,
  deleteImage
} from './utils'

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

const DockerImage = {
  async build(prevInstance, context) {
    const { tag } = this

    await checkDockerSetup()

    context.log(`Building Docker image based on "${this.dockerfilePath}"...`)

    await buildImage(this.dockerfilePath, this.tag, this.contextPath)

    const outputs = { tag }
    const state = { ...this }
    delete state.username
    delete state.password
    context.saveState(this, state)

    context.log(`Image successfully built with tag "${tag}"`)

    return outputs
  },
  async deploy(prevInstance, context) {
    const state = context.getState(this)
    // build if we don't have state yet (haven't run `build` before)
    if (Object.keys(state).length === 0) {
      await build(prevInstance, context)
    }

    const { username, password, tag, registryUrl } = this

    await checkDockerSetup()

    context.log(`Pushing Docker image to registry "${registryUrl}"...`)

    await login(username, password, registryUrl)
    await pushImage(tag)
    await logout(registryUrl)

    const outputs = { tag }
    const newState = { ...this }
    delete newState.username
    delete newState.password
    context.saveState(this, newState)

    context.log(`Image successfully pushed to registry "${registryUrl}"`)

    return outputs
  },
  async remove(prevInstance, context) {
    const { username, password } = this
    const { tag, registryUrl } = context.getState(this)

    await checkDockerSetup()

    context.log(`Removing Docker image "${tag}" locally...`)
    await removeImage(tag)

    context.log(`Removing Docker image "${tag}" from registry "${registryUrl}"...`)
    const token = await getToken(username, password, registryUrl)
    await deleteImage(token, tag, registryUrl)

    context.saveState(this, {})
    return {}
  }
}

export default DockerImage
