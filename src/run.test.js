import { difference } from 'ramda'
import run from './run'
import * as utils from './utils'

jest.mock('./utils')

afterAll(() => {
  jest.restoreAllMocks()
})

afterEach(() => {
  jest.resetAllMocks()
})

const projectPath = process.cwd()
const serverlessFileComponents = {
  iamMock: { id: 'iam-mock-id', type: 'iam-mock' }
}
const stateFileComponents = {
  iamMock: { id: 'iam-mock-id', type: 'iam-mock' },
  functionMock: { id: 'function-mock-id', type: 'function-mock' }
}
const orphanedComponents = difference(serverlessFileComponents, stateFileComponents)

beforeEach(() => {
  utils.handleSignalEvents.mockImplementation(() => {})
  utils.getComponentsFromServerlessFile.mockImplementation(() =>
    Promise.resolve(serverlessFileComponents)
  )
  utils.getComponentsFromStateFile.mockImplementation(() => stateFileComponents)
  utils.getOrphanedComponents.mockImplementation(() => orphanedComponents)
  utils.trackDeployment.mockImplementation(() => Promise.resolve())
  utils.buildGraph.mockImplementation(() => Promise.resolve())
  utils.readStateFile.mockImplementation(() => Promise.resolve())
  utils.setAppId.mockImplementation(() => Promise.resolve())
  utils.executeGraph.mockImplementation(() => Promise.resolve())
  utils.writeStateFile.mockImplementation(() => Promise.resolve())
  utils.errorReporter.mockImplementation(() => Promise.resolve())
})

describe('#run()', () => {
  it('should run the command on the graph', async () => {
    const res = await run('some-command', { projectPath })
    expect(res).toEqual({
      iamMock: {
        id: 'iam-mock-id',
        type: 'iam-mock'
      }
    })

    expect(utils.handleSignalEvents).toHaveBeenCalled()
    expect(utils.getComponentsFromServerlessFile.mock.calls[0][1]).toEqual(projectPath)
    expect(utils.getComponentsFromServerlessFile.mock.calls[0][2]).toBeFalsy() // no serverlessFileObject
    expect(utils.getComponentsFromStateFile).toHaveBeenCalled()
    expect(utils.getOrphanedComponents).toHaveBeenCalled()
    expect(utils.trackDeployment).not.toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalledTimes(1)
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.setAppId).toHaveBeenCalled()
    expect(utils.executeGraph).toHaveBeenCalledTimes(1)
    expect(utils.writeStateFile).toHaveBeenCalled()
    expect(utils.errorReporter).toHaveBeenCalled()
  })

  it('should report any errors to Sentry while still writing the state to disk', async () => {
    utils.executeGraph.mockImplementation(() => Promise.reject(new Error('something went wrong')))

    await expect(run('some-command', { projectPath })).rejects.toHaveProperty(
      'message',
      'something went wrong'
    )

    expect(utils.handleSignalEvents).toHaveBeenCalled()
    expect(utils.getComponentsFromServerlessFile.mock.calls[0][1]).toEqual(projectPath)
    expect(utils.getComponentsFromServerlessFile.mock.calls[0][2]).toBeFalsy() // no serverlessFileObject
    expect(utils.getComponentsFromStateFile).toHaveBeenCalled()
    expect(utils.getOrphanedComponents).toHaveBeenCalled()
    expect(utils.trackDeployment).not.toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalledTimes(1)
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.setAppId).toHaveBeenCalled()
    expect(utils.executeGraph).toHaveBeenCalledTimes(1)
    expect(utils.writeStateFile).toHaveBeenCalled()
    expect(utils.errorReporter).toHaveBeenCalled()
  })

  it('should support serverless.yml file object passed in via options', async () => {
    const serverlessFileObject = {
      type: 'my-app',
      version: '0.1.0',
      components: {
        iamMock: { id: 'iam-mock-id', type: 'iam-mock' }
      }
    }
    const res = await run('some-commands', {
      projectPath,
      serverlessFileObject
    })
    expect(res).toEqual({
      iamMock: {
        id: 'iam-mock-id',
        type: 'iam-mock'
      }
    })

    expect(utils.handleSignalEvents).toHaveBeenCalled()
    // NOTE: we don't check for the first argument (which is the state object) since the empty
    // state object is created on the fly and differs from the one we'd check against here
    expect(utils.getComponentsFromServerlessFile.mock.calls[0][1]).toEqual(projectPath)
    expect(utils.getComponentsFromServerlessFile.mock.calls[0][2]).toEqual(serverlessFileObject)
    expect(utils.getComponentsFromStateFile).toHaveBeenCalled()
    expect(utils.getOrphanedComponents).toHaveBeenCalled()
    expect(utils.trackDeployment).not.toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalledTimes(1)
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.setAppId).toHaveBeenCalled()
    expect(utils.executeGraph).toHaveBeenCalledTimes(1)
    expect(utils.writeStateFile).toHaveBeenCalled()
    expect(utils.errorReporter).toHaveBeenCalled()
  })

  describe('when running "deploy"', () => {
    it('should run "deploy", "info", track the deployment and write the state to disk', async () => {
      const res = await run('deploy', { projectPath })
      expect(res).toEqual({
        iamMock: {
          id: 'iam-mock-id',
          type: 'iam-mock'
        }
      })

      expect(utils.handleSignalEvents).toHaveBeenCalled()
      expect(utils.getComponentsFromServerlessFile.mock.calls[0][1]).toEqual(projectPath)
      expect(utils.getComponentsFromServerlessFile.mock.calls[0][2]).toBeFalsy() // no serverlessFileObject
      expect(utils.getComponentsFromStateFile).toHaveBeenCalled()
      expect(utils.getOrphanedComponents).toHaveBeenCalled()
      expect(utils.trackDeployment).toHaveBeenCalled()
      expect(utils.buildGraph).toHaveBeenCalledTimes(2)
      expect(utils.readStateFile).toHaveBeenCalled()
      expect(utils.setAppId).toHaveBeenCalled()
      expect(utils.executeGraph).toHaveBeenCalledTimes(2)
      expect(utils.writeStateFile).toHaveBeenCalled()
      expect(utils.errorReporter).toHaveBeenCalled()
    })
  })

  describe('when running "remove"', () => {
    it('should run "remove" but should not run "info" neither track the deployment', async () => {
      const res = await run('remove', { projectPath })
      expect(res).toEqual({
        iamMock: {
          id: 'iam-mock-id',
          type: 'iam-mock'
        },
        functionMock: {
          id: 'function-mock-id',
          type: 'function-mock'
        }
      })

      expect(utils.handleSignalEvents).toHaveBeenCalled()
      expect(utils.getComponentsFromServerlessFile.mock.calls[0][1]).toEqual(projectPath)
      expect(utils.getComponentsFromServerlessFile.mock.calls[0][2]).toBeFalsy() // no serverlessFileObject
      expect(utils.getComponentsFromStateFile).toHaveBeenCalled()
      expect(utils.getOrphanedComponents).not.toHaveBeenCalled()
      expect(utils.trackDeployment).not.toHaveBeenCalled()
      expect(utils.buildGraph).toHaveBeenCalledTimes(1)
      expect(utils.readStateFile).toHaveBeenCalled()
      expect(utils.setAppId).toHaveBeenCalled()
      expect(utils.executeGraph).toHaveBeenCalledTimes(1)
      expect(utils.writeStateFile).toHaveBeenCalled()
      expect(utils.errorReporter).toHaveBeenCalled()
    })
  })
})
