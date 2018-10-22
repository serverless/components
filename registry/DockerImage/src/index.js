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

const DockerImage = {
  async build(prevInstance, context) {
    const { tag } = this

    await checkDockerSetup()

    context.log(`Building Docker image based on "${this.dockerfilePath}"...`)

    await buildImage(this.dockerfilePath, this.tag, this.contextPath)

    context.log(`Image successfully built with tag "${tag}"`)
  },
  async deploy(prevInstance, context) {
    // build if it's the first deployment (haven't run `build` before)
    if (!prevInstance) {
      await this.build(prevInstance, context)
    }

    const { username, password, tag, registryUrl } = this

    await checkDockerSetup()

    context.log(`Pushing Docker image to registry "${registryUrl}"...`)

    await login(username, password, registryUrl)
    await pushImage(tag)
    await logout(registryUrl)

    context.log(`Image successfully pushed to registry "${registryUrl}"`)
  },
  async remove(context) {
    const { username, password, tag, registryUrl } = this

    await checkDockerSetup()

    context.log(`Removing Docker image "${tag}" locally...`)
    await removeImage(tag)

    context.log(`Removing Docker image "${tag}" from registry "${registryUrl}"...`)
    const token = await getToken(username, password, registryUrl)
    await deleteImage(token, tag, registryUrl)
  }
}

export default DockerImage
