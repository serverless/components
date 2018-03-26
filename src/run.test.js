const run = require('./run')
const utils = require('./utils')

jest.mock('./utils')

afterAll(() => {
  jest.restoreAllMocks()
})

utils.getComponentsToUse.mockImplementation(() =>
  Promise.resolve({ componentToUse: { id: 'component1', type: 'function' } }))
utils.getComponentsToRemove.mockImplementation(() =>
  Promise.resolve({ componentToRemove: { id: 'component2', type: 'iam' } }))
utils.buildGraph.mockImplementation(() => Promise.resolve())
utils.readStateFile.mockImplementation(() => Promise.resolve())
utils.setServiceId.mockImplementation(() => Promise.resolve())
utils.writeStateFile.mockImplementation(() => Promise.resolve())
utils.errorReporter.mockImplementation(() => Promise.resolve())

describe('#run()', () => {
  it('should execute and write the state to disk', async () => {
    utils.executeGraph.mockImplementation(() => Promise.resolve())

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

    expect(utils.getComponentsToUse).toHaveBeenCalled()
    expect(utils.getComponentsToRemove).toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalled()
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.setServiceId).toHaveBeenCalled()
    expect(utils.executeGraph).toHaveBeenCalled()
    expect(utils.writeStateFile).toHaveBeenCalled()
    expect(utils.errorReporter).toHaveBeenCalled()
  })

  it('should report any errors to Sentry while still writing the state to disk', async () => {
    utils.executeGraph.mockImplementation(() => Promise.reject(new Error('something went wrong')))

    await expect(run('deploy', {})).rejects.toThrow('something went wrong')

    expect(utils.getComponentsToUse).toHaveBeenCalled()
    expect(utils.getComponentsToRemove).toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalled()
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.setServiceId).toHaveBeenCalled()
    expect(utils.executeGraph).toHaveBeenCalled()
    expect(utils.writeStateFile).toHaveBeenCalled()
    expect(utils.errorReporter).toHaveBeenCalled()
  })
})
