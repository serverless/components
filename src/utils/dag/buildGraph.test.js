import { createTestContext } from '../../../test'
import buildGraph from './buildGraph'

beforeEach(async () => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#buildGraph()', () => {
  let context
  let Component

  beforeEach(async () => {
    context = await createTestContext()
    Component = await context.loadType('Component')
  })

  it('build a simple graph for a single component', async () => {
    let nextInstance = await context.construct(Component, {})
    nextInstance = await context.defineComponent(nextInstance)

    const graph = buildGraph(nextInstance, null)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))
    expect(graph.edges()).toEqual([])
  })

  it('build a graph for a component with a child', async () => {
    const nextInstance = await context.construct(Component, {})
    const fooComponent = await context.construct(Component, {})
    nextInstance.foo = fooComponent

    const graph = buildGraph(nextInstance, null)
    expect(graph.nodes()).toEqual(
      expect.arrayContaining([nextInstance.instanceId, fooComponent.instanceId])
    )
    expect(graph.edges()).toEqual(
      expect.arrayContaining([{ v: nextInstance.instanceId, w: fooComponent.instanceId }])
    )
  })
})
