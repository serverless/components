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
    Component = await context.loadType('./')
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
