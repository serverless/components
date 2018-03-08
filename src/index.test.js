const index = require('./index')
const utils = require('./utils')

jest.mock('./utils')

afterAll(() => {
  jest.restoreAllMocks()
})

utils.getComponents.mockImplementation(() => Promise.resolve({ some: 'component' }))
utils.buildGraph.mockImplementation(() => Promise.resolve())
utils.readStateFile.mockImplementation(() => Promise.resolve())
utils.writeStateFile.mockImplementation(() => Promise.resolve())
utils.errorReporter.mockImplementation(() => Promise.resolve())

describe('#run()', () => {
  it('should execute and write the state to disk', async () => {
    utils.executeGraph.mockImplementation(() => Promise.resolve())

    const res = await index.run('deploy', {})
    expect(res).toEqual({ some: 'component' })

    expect(utils.getComponents).toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalled()
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.executeGraph).toHaveBeenCalled()
    expect(utils.writeStateFile).toHaveBeenCalled()
    expect(utils.errorReporter).toHaveBeenCalled()
  })

  it('should report any errors to Sentry while still writing the state to disk', async () => {
    utils.executeGraph.mockImplementation(() => Promise.reject(new Error('something went wrong')))

    const res = await index.run('deploy', {})
    expect(res).toEqual({ some: 'component' })

    expect(utils.getComponents).toHaveBeenCalled()
    expect(utils.buildGraph).toHaveBeenCalled()
    expect(utils.readStateFile).toHaveBeenCalled()
    expect(utils.executeGraph).toHaveBeenCalled()
    expect(utils.writeStateFile).toHaveBeenCalled()
    expect(utils.errorReporter).toHaveBeenCalled()
  })
})
