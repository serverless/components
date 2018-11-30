import path from 'path'
import { createContext } from '../../../src/utils'
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

jest.mock('./utils', () => ({
  checkDockerSetup: jest.fn(),
  buildImage: jest.fn(),
  login: jest.fn(),
  pushImage: jest.fn(),
  logout: jest.fn(),
  removeImage: jest.fn(),
  getToken: jest.fn().mockReturnValue('sometoken'),
  deleteImage: jest.fn()
}))

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe.skip('DockerImage', () => {
  it('should build and deploy if it is the first deployment', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const DockerImage = await context.import('./')
    const dockerImage = await context.construct(DockerImage, {})

    dockerImage.dockerfilePath = 'some/path'
    dockerImage.contextPath = 'some/context/path'
    dockerImage.tag = 'sometag'
    dockerImage.registryUrl = 'https://someurl.com'
    dockerImage.username = 'foo'
    dockerImage.password = 'bar'

    await dockerImage.deploy(undefined, context)

    expect(checkDockerSetup).toHaveBeenCalledTimes(2)
    expect(buildImage).toBeCalledWith(
      dockerImage.dockerfilePath,
      dockerImage.tag,
      dockerImage.contextPath
    )
    expect(login).toBeCalledWith(
      dockerImage.username,
      dockerImage.password,
      dockerImage.registryUrl
    )
    expect(pushImage).toBeCalledWith(dockerImage.tag)
    expect(logout).toBeCalledWith(dockerImage.registryUrl)
  })

  it('should NOT build if it is not the first deployment', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const DockerImage = await context.import('./')
    const dockerImage = await context.construct(DockerImage, {})

    dockerImage.dockerfilePath = 'some/path'
    dockerImage.contextPath = 'some/context/path'
    dockerImage.tag = 'sometag'
    dockerImage.registryUrl = 'https://someurl.com'
    dockerImage.username = 'foo'
    dockerImage.password = 'bar'

    await dockerImage.deploy({ some: 'prob' }, context)

    expect(checkDockerSetup).toHaveBeenCalledTimes(1)
    expect(buildImage).not.toHaveBeenCalled()
    expect(login).toBeCalledWith(
      dockerImage.username,
      dockerImage.password,
      dockerImage.registryUrl
    )
    expect(pushImage).toBeCalledWith(dockerImage.tag)
    expect(logout).toBeCalledWith(dockerImage.registryUrl)
  })

  it('should remove docker image', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const DockerImage = await context.import('./')
    const dockerImage = await context.construct(DockerImage, {})

    dockerImage.dockerfilePath = 'some/path'
    dockerImage.contextPath = 'some/context/path'
    dockerImage.tag = 'sometag'
    dockerImage.registryUrl = 'https://someurl.com'
    dockerImage.username = 'foo'
    dockerImage.password = 'bar'

    await dockerImage.remove(context)

    expect(checkDockerSetup).toHaveBeenCalledTimes(1)
    expect(removeImage).toBeCalledWith(dockerImage.tag)
    expect(getToken).toBeCalledWith(
      dockerImage.username,
      dockerImage.password,
      dockerImage.registryUrl
    )
    expect(deleteImage).toBeCalledWith('sometoken', dockerImage.tag, dockerImage.registryUrl)
    expect(deleteImage).toHaveBeenCalledTimes(1)
  })
})
