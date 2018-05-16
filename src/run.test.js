const { difference } = require('ramda')
const run = require('./run')
const utils = require('./utils')

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
  utils.setServiceId.mockImplementation(() => Promise.resolve())
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
    expect(utils.getComponentsFromServerlessFile).toHaveBeenCalled()
    expect(utils.getComponentsFromStateFile).toHaveBeenCalled()
    expect(utils.getOrphanedComponents).toHaveBeenCalled()
    expect(utils.trackDeployment).not.toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalledTimes(1)
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.setServiceId).toHaveBeenCalled()
    expect(utils.executeGraph).toHaveBeenCalledTimes(1)
    expect(utils.writeStateFile).toHaveBeenCalled()
    expect(utils.errorReporter).toHaveBeenCalled()
  })

  it('should report any errors to Sentry while still writing the state to disk', async () => {
    utils.executeGraph.mockImplementation(() => Promise.reject(new Error('something went wrong')))

    await expect(run('some-command', { projectPath })).rejects.toThrow('something went wrong')

    expect(utils.handleSignalEvents).toHaveBeenCalled()
    expect(utils.getComponentsFromServerlessFile).toHaveBeenCalled()
    expect(utils.getComponentsFromStateFile).toHaveBeenCalled()
    expect(utils.getOrphanedComponents).toHaveBeenCalled()
    expect(utils.trackDeployment).not.toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalledTimes(1)
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.setServiceId).toHaveBeenCalled()
    expect(utils.executeGraph).toHaveBeenCalledTimes(1)
    expect(utils.writeStateFile).toHaveBeenCalled()
    expect(utils.errorReporter).toHaveBeenCalled()
  })

  it('should prefer components passed in via options', async () => {
    const res = await run('some-commands', {
      projectPath,
      serverlessFileComponents,
      stateFileComponents
    })
    expect(res).toEqual({
      iamMock: {
        id: 'iam-mock-id',
        type: 'iam-mock'
      }
    })

    expect(utils.handleSignalEvents).toHaveBeenCalled()
    expect(utils.getComponentsFromServerlessFile).not.toHaveBeenCalled()
    expect(utils.getComponentsFromStateFile).not.toHaveBeenCalled()
    expect(utils.getOrphanedComponents).toHaveBeenCalled()
    expect(utils.trackDeployment).not.toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalledTimes(1)
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.setServiceId).toHaveBeenCalled()
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
      expect(utils.getComponentsFromServerlessFile).toHaveBeenCalled()
      expect(utils.getComponentsFromStateFile).toHaveBeenCalled()
      expect(utils.getOrphanedComponents).toHaveBeenCalled()
      expect(utils.trackDeployment).toHaveBeenCalled()
      expect(utils.buildGraph).toHaveBeenCalledTimes(2)
      expect(utils.readStateFile).toHaveBeenCalled()
      expect(utils.setServiceId).toHaveBeenCalled()
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
      expect(utils.getComponentsFromServerlessFile).toHaveBeenCalled()
      expect(utils.getComponentsFromStateFile).toHaveBeenCalled()
      expect(utils.getOrphanedComponents).not.toHaveBeenCalled()
      expect(utils.trackDeployment).not.toHaveBeenCalled()
      expect(utils.buildGraph).toHaveBeenCalledTimes(1)
      expect(utils.readStateFile).toHaveBeenCalled()
      expect(utils.setServiceId).toHaveBeenCalled()
      expect(utils.executeGraph).toHaveBeenCalledTimes(1)
      expect(utils.writeStateFile).toHaveBeenCalled()
      expect(utils.errorReporter).toHaveBeenCalled()
    })
  })
})
