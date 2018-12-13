import { resolveComponentEvaluables } from '../component'
import { deserialize, serialize } from '../serialize'
import { createTestContext } from '../../../test'
import buildGraph from './buildGraph'
import { SYMBOL_STATE } from '../constants'

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
    Component = await context.import('Component')
  })

  it('build a simple graph from instance when none exists', () => {
    const nextInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    const graph = buildGraph(nextInstance, null)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))
    expect(graph.edges()).toEqual([])
    expect(graph.node(nextInstance.instanceId)).toEqual({
      instanceId: nextInstance.instanceId,
      nextInstance,
      prevInstance: null,
      operation: undefined // NOTE BRN: This gets set later in the deployGraph phase
    })
  })

  it('build a simple graph from instance when one ALREADY exists', () => {
    const nextInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    const prevInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    const graph = buildGraph(nextInstance, prevInstance)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))
    expect(graph.edges()).toEqual([])
    expect(graph.node(nextInstance.instanceId)).toEqual({
      instanceId: nextInstance.instanceId,
      nextInstance,
      prevInstance,
      operation: undefined // NOTE BRN: This gets set later in the deployGraph phase
    })
  })

  it('build a simple graph and not include instances removed from provider', () => {
    const nextInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    const prevInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(),
      status: 'removed',
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    const graph = buildGraph(nextInstance, prevInstance)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))
    expect(graph.edges()).toEqual([])
    expect(graph.node('test').prevInstance).toEqual(null)
  })

  it('build a simple graph and add provider state if available', () => {
    const nextInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    nextInstance[SYMBOL_STATE] = { foo: 'bar' }

    const prevInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(),
      status: 'removed',
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    const graph = buildGraph(nextInstance, prevInstance)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))
    expect(graph.edges()).toEqual([])
    expect(graph.node('test').prevInstance).toEqual({ foo: 'bar' })
  })

  it('build a simple graph when only instance has been removed', () => {
    const prevInstance = {
      instanceId: 'test',
      shouldDeploy: jest.fn(),
      deploy: jest.fn(),
      define: jest.fn(),
      remove: jest.fn(),
      construct: jest.fn()
    }

    const graph = buildGraph(null, prevInstance)
    expect(graph.nodes()).toEqual(expect.arrayContaining([prevInstance.instanceId]))
    expect(graph.edges()).toEqual([])
    expect(graph.node(prevInstance.instanceId)).toEqual({
      instanceId: prevInstance.instanceId,
      nextInstance: null,
      prevInstance,
      operation: 'remove'
    })
  })

  it('build a simple graph for a single Component when none exists', async () => {
    let nextInstance = await context.construct(Component, {})
    nextInstance = await context.defineComponent(nextInstance, null)

    const graph = buildGraph(nextInstance, null)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))
    expect(graph.edges()).toEqual([])
    expect(graph.node(nextInstance.instanceId)).toEqual({
      instanceId: nextInstance.instanceId,
      nextInstance,
      prevInstance: null,
      operation: undefined // NOTE BRN: This gets set later in the deployGraph phase
    })
  })

  it('build a simple graph for a single Component when one ALREADY exists', async () => {
    let component = await context.construct(Component, {})
    component = await context.defineComponent(component, null)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevInstance = await deserialize(serialize(component, context), context)

    let nextInstance = await context.construct(Component, {})
    nextInstance.hydrate(prevInstance)
    nextInstance = await context.defineComponent(nextInstance, prevInstance)
    nextInstance = resolveComponentEvaluables(nextInstance)

    const graph = buildGraph(nextInstance, prevInstance)
    expect(graph.nodes()).toEqual(expect.arrayContaining([nextInstance.instanceId]))
    expect(graph.edges()).toEqual([])
    expect(graph.node(nextInstance.instanceId)).toEqual({
      instanceId: nextInstance.instanceId,
      nextInstance,
      prevInstance,
      operation: undefined // NOTE BRN: This gets set later in the deployGraph phase
    })
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

  it('build a graph for a component with a removed child and a new child', async () => {
    let component = await context.construct(Component, {
      components: {
        foo: await context.construct(Component, {})
      }
    })
    component = await context.defineComponent(component)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevInstance = await deserialize(serialize(component, context), context)

    let nextInstance = await context.construct(Component, {
      components: {
        bar: await context.construct(Component, {})
      }
    })
    nextInstance.hydrate(prevInstance)
    nextInstance = await context.defineComponent(nextInstance, prevInstance)
    nextInstance = resolveComponentEvaluables(nextInstance)

    const graph = buildGraph(nextInstance, prevInstance)
    expect(graph.nodes()).toEqual(
      expect.arrayContaining([
        nextInstance.instanceId,
        nextInstance.components.bar.instanceId,
        prevInstance.components.foo.instanceId
      ])
    )
    expect(graph.edges()).toEqual(
      expect.arrayContaining([
        {
          v: nextInstance.instanceId,
          w: nextInstance.components.bar.instanceId
        },
        {
          v: nextInstance.instanceId,
          w: prevInstance.components.foo.instanceId
        }
      ])
    )
    expect(graph.node(nextInstance.instanceId)).toEqual({
      nextInstance,
      prevInstance,
      operation: undefined,
      instanceId: nextInstance.instanceId
    })

    expect(graph.node(prevInstance.components.foo.instanceId)).toEqual({
      nextInstance: null,
      prevInstance: prevInstance.components.foo,
      operation: 'remove',
      instanceId: prevInstance.components.foo.instanceId
    })

    expect(graph.node(nextInstance.components.bar.instanceId)).toEqual({
      nextInstance: nextInstance.components.bar,
      prevInstance: null,
      operation: undefined, // NOTE BRN: This gets set later during the deployGraph phase
      instanceId: nextInstance.components.bar.instanceId
    })
  })
})
