import path from 'path'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('Component', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let Component

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    Component = await context.import('./')
  })

  it('should return components as children when calling define', async () => {
    const component = await context.construct(Component, {})

    component.components = {
      myComponent: {
        name: 'abc'
      }
    }

    const children = await component.define()

    expect(children).toEqual(component.components)
  })

  it('shouldDeploy should return deploy when prevInstance is null', async () => {
    const component = await context.construct(Component, {})

    expect(component.shouldDeploy(null, context)).toEqual('deploy')
  })

  it('shouldDeploy should return undefined when no changes have occurred in empty components', async () => {
    let component = await context.construct(Component, {})
    component = await context.defineComponent(component)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    let nextComponent = await context.construct(Component, {})
    nextComponent = await context.defineComponent(nextComponent, prevComponent)
    nextComponent = resolveComponentEvaluables(nextComponent)

    const result = nextComponent.shouldDeploy(prevComponent, context)

    expect(result).toBe(undefined)
  })

  it("shouldDeploy should return undefined when inputs don't change", async () => {
    let component = await context.construct(Component, {
      foo: {
        bar: 'value'
      }
    })
    component = await context.defineComponent(component)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    let nextComponent = await context.construct(Component, {
      foo: {
        bar: 'value'
      }
    })
    nextComponent = await context.defineComponent(nextComponent, prevComponent)
    nextComponent = resolveComponentEvaluables(nextComponent)

    const result = nextComponent.shouldDeploy(prevComponent, context)

    expect(result).toBe(undefined)
  })

  it('shouldDeploy should return "deploy" when inputs change', async () => {
    let component = await context.construct(Component, {
      foo: {
        bar: 'value'
      }
    })
    component = await context.defineComponent(component, null)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    let nextComponent = await context.construct(Component, {
      foo: {
        bar: 'new-value'
      }
    })
    nextComponent = await context.defineComponent(nextComponent, prevComponent)
    nextComponent = resolveComponentEvaluables(nextComponent)

    const result = nextComponent.shouldDeploy(prevComponent, context)

    expect(result).toBe('deploy')
  })

  it("shouldDeploy should return undefined when inputs with components don't change", async () => {
    let component = await context.construct(Component, {
      components: {
        foo: await context.construct(Component, {})
      }
    })
    component = await context.defineComponent(component)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    let nextComponent = await context.construct(Component, {
      components: {
        foo: await context.construct(Component, {})
      }
    })
    nextComponent = await context.defineComponent(nextComponent, prevComponent)
    nextComponent = resolveComponentEvaluables(nextComponent)

    const result = nextComponent.shouldDeploy(prevComponent, context)

    expect(result).toBe(undefined)
  })

  it('should generate an instanceId on construct', async () => {
    const component = await context.construct(Component, {})
    expect(typeof component.instanceId).toBe('string')
  })

  it('should preserve instanceId on hydrate', async () => {
    let component = await context.construct(Component, {})
    component = await context.defineComponent(component)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    const nextComponent = await context.construct(Component, {})
    nextComponent.hydrate(prevComponent, context)

    expect(nextComponent.instanceId).toBe(prevComponent.instanceId)
  })
})
