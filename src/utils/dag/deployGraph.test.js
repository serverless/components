import { createTestContext } from '../../../test'
import buildGraph from './buildGraph'
import deployGraph from './deployGraph'

beforeEach(async () => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#deployGraph()', () => {
  let context

  beforeEach(async () => {
    context = await createTestContext()
    // NOTE: we need to replace `log` with `debug` since this is what components get
    context = {
      ...context,
      log: context.debug
    }
  })

  it('calls deploy when shouldDeploy returns "deploy"', async () => {
    const nextInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(() => 'deploy'),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    let graph = buildGraph(nextInstance, null)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))

    graph = await deployGraph(graph, context)
    // NOTE BRN: graph should be empty after deployment (all nodes removed since they've been deployed)
    expect(graph.nodes()).toEqual([])

    expect(nextInstance.shouldDeploy).toBeCalledWith(null, context)
    expect(nextInstance.deploy).toBeCalledWith(null, context)
  })

  it('calls deploy with prevInstance when shouldDeploy returns "deploy"', async () => {
    const nextInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(() => 'deploy'),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    const prevInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(() => 'deploy'),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    let graph = buildGraph(nextInstance, prevInstance)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))

    graph = await deployGraph(graph, context)
    // NOTE BRN: graph should be empty after deployment (all nodes removed since they've been deployed)
    expect(graph.nodes()).toEqual([])

    // NOTE BRN
    expect(nextInstance.shouldDeploy).toBeCalledWith(prevInstance, context)
    expect(nextInstance.deploy).toBeCalledWith(prevInstance, context)
  })

  it('calls deploy when shouldDeploy returns "replace" with no prevInstance', async () => {
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

    graph = await deployGraph(graph, context)
    // NOTE BRN: graph should be empty after deployment (all nodes removed since they've been deployed)
    expect(graph.nodes()).toEqual([])

    expect(nextInstance.shouldDeploy).toBeCalledWith(prevInstance, context)
    // NOTE BRN: deploy should not be called with prevInstance when performing a replacement since it should be treated as a first time deployment.
    expect(nextInstance.deploy).toBeCalledWith(null, context)
  })
})
