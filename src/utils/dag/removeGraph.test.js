import { createTestContext } from '../../../test'
import buildGraph from './buildGraph'
import deployGraph from './deployGraph'
import removeGraph from './removeGraph'

beforeEach(async () => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#removeGraph()', () => {
  let context

  beforeEach(async () => {
    context = await createTestContext()
    // NOTE: we need to replace `log` with `debug` since this is what components get
    context = {
      ...context,
      log: context.debug
    }
  })

  it('calls remove when shouldDeploy returns "remove"', async () => {
    const nextInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(() => 'remove'),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    let graph = buildGraph(nextInstance, null)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))

    // NOTE BRN: depoloyGraph needs to be called first since it sets the operation using souldDeploy
    await deployGraph(graph, context)
    graph = await removeGraph(graph, context)
    // NOTE BRN: graph should be empty after deployment (all nodes removed since they've been deployed)
    expect(graph.nodes()).toEqual([])

    expect(nextInstance.shouldDeploy).toBeCalledWith(null, context)
    expect(nextInstance.remove).toBeCalledWith(context)
  })

  it('calls remove on prevInstance when only instance has been removed', async () => {
    const prevInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    let graph = buildGraph(null, prevInstance)
    expect(graph.nodes()).toEqual(expect.arrayContaining([prevInstance.instanceId]))

    graph = await removeGraph(graph, context)
    // NOTE BRN: graph should be empty after deployment (all nodes removed since they've been deployed)
    expect(graph.nodes()).toEqual([])
    expect(prevInstance.remove).toBeCalledWith(context)
  })

  it('calls remove when shouldDeploy returns "replace"', async () => {
    const nextInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(() => 'replace'),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    const prevInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(() => 'replace'),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    let graph = buildGraph(nextInstance, prevInstance)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))

    // NOTE BRN: depoloyGraph needs to be called first since it sets the operation using souldDeploy
    await deployGraph(graph, context)
    graph = await removeGraph(graph, context)
    // NOTE BRN: graph should be empty after deployment (all nodes removed since they've been deployed)
    expect(graph.nodes()).toEqual([])

    // NOTE BRN: deploy should not be called with prevInstance when performing a replacement since it should be treated as a first time deployment.
    expect(prevInstance.remove).toBeCalledWith(context)
  })
})
