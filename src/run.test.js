const run = require('./run')
const utils = require('./utils')

jest.mock('./utils')

afterAll(() => {
  jest.restoreAllMocks()
})

afterEach(() => {
  jest.resetAllMocks()
})

beforeEach(() => {
  utils.handleSignalEvents.mockImplementation(() => {})
  utils.getComponentsFromServerlessFile.mockImplementation(() =>
    Promise.resolve({ componentToUse: { id: 'component1', type: 'function' } }))
  utils.getComponentsToRemove.mockImplementation(() =>
    Promise.resolve({ componentToRemove: { id: 'component2', type: 'iam' } }))
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
    const res = await run('some-command', {})
    expect(res).toEqual({
      componentToUse: {
        id: 'component1',
        type: 'function'
      },
      componentToRemove: {
        id: 'component2',
        type: 'iam'
      }
    })

    expect(utils.handleSignalEvents).toHaveBeenCalled()
    expect(utils.getComponentsFromServerlessFile).toHaveBeenCalled()
    expect(utils.getComponentsToRemove).toHaveBeenCalled()
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

    await expect(run('some-command', {})).rejects.toThrow('something went wrong')

    expect(utils.handleSignalEvents).toHaveBeenCalled()
    expect(utils.getComponentsFromServerlessFile).toHaveBeenCalled()
    expect(utils.getComponentsToRemove).toHaveBeenCalled()
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
      const res = await run('deploy', {})
      expect(res).toEqual({
        componentToUse: {
          id: 'component1',
          type: 'function'
        },
        componentToRemove: {
          id: 'component2',
          type: 'iam'
        }
      })

      expect(utils.handleSignalEvents).toHaveBeenCalled()
      expect(utils.getComponentsFromServerlessFile).toHaveBeenCalled()
      expect(utils.getComponentsToRemove).toHaveBeenCalled()
      expect(utils.trackDeployment).toHaveBeenCalled()
      expect(utils.buildGraph).toHaveBeenCalledTimes(2)
      expect(utils.readStateFile).toHaveBeenCalled()
      expect(utils.setServiceId).toHaveBeenCalled()
      expect(utils.executeGraph).toHaveBeenCalledTimes(2)
      expect(utils.writeStateFile).toHaveBeenCalled()
      expect(utils.errorReporter).toHaveBeenCalled()
    })
  })
})
