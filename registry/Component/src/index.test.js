import path from 'path'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import newVariable from '../../../src/utils/variable/newVariable.js'
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

  describe('#define()', () => {
    it('should return components as children when calling define', async () => {
      const component = context.construct(Component, {})

      component.components = {
        myComponent: {
          type: './',
          inputs: {}
        }
      }

      const children = await component.define()

      expect(children).toEqual({ components: component.components })
    })

    it('should support child components defined at different properties', async () => {
      const component = context.construct(Component, {})
      const instance = context.construct(Component, {})

      component.components = {
        component1: {
          type: './',
          inputs: {}
        }
      }

      component.component2 = {
        type: './',
        inputs: {}
      }

      component.component3 = instance

      component.objectProp = {
        component4: {
          type: './',
          inputs: {}
        },
        component5: {
          type: './',
          inputs: {}
        }
      }

      component.arrayProp = [
        { component6: { type: './', inputs: {} } },
        { component7: { type: './', inputs: {} } }
      ]

      const children = await component.define()

      expect(children.components.component1).toEqual(component.components.component1)
      expect(children.component2).toEqual(component.component2)
      expect(children.component3).toEqual(component.component3)
      expect(children.objectProp).toEqual(component.objectProp)
      expect(children.arrayProp).toEqual(component.arrayProp)
    })

    it('should support child components which are passed in via inputs', async () => {
      const instance = context.construct(Component, {})
      let component = context.construct(Component, { childComponent: instance })
      component.inputTypes.childComponent = { type: 'Component' }
      component.component1 = newVariable('${inputs.childComponent}', {
        inputs: { childComponent: instance }
      })

      component = resolveComponentEvaluables(component)

      const children = await component.define()

      expect(children.component1).toEqual(component.inputs.childComponent)
    })

    it('should ignore the "parent" property when walking the instance', async () => {
      const component = context.construct(Component, {})

      component.parent = {
        type: './',
        inputs: {}
      }

      const children = await component.define()

      expect(children.parent).toBeUndefined()
    })
  })

  describe('#info()', () => {
    it('should call "info" on every child and gather the results', async () => {
      const component = context.construct(Component, {})
      const instance = context.construct(Component, {})

      jest.spyOn(instance, 'info')

      component.component1 = instance
      component.components = {
        component2: instance
      }
      component.objectProp = {
        foo: {
          bar: instance
        }
      }

      const res = await component.info()

      expect(instance.info).toHaveBeenCalledTimes(3)
      expect(res.children).toHaveLength(3)
      expect(res.children[0].type).toEqual('Component')
      expect(res.children[1].type).toEqual('Component')
      expect(res.children[2].type).toEqual('Component')
    })
  })

  it('shouldDeploy should return deploy when prevInstance is null', async () => {
    const component = context.construct(Component, {})

    expect(component.shouldDeploy(null, context)).toEqual('deploy')
  })

  it('shouldDeploy should return undefined when no changes have occurred in empty components', async () => {
    let component = context.construct(Component, {})
    component = await context.defineComponent(component)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    let nextComponent = context.construct(Component, {})
    nextComponent = await context.defineComponent(nextComponent, prevComponent)
    nextComponent = resolveComponentEvaluables(nextComponent)

    const result = nextComponent.shouldDeploy(prevComponent, context)

    expect(result).toBe(undefined)
  })

  it("shouldDeploy should return undefined when inputs don't change", async () => {
    let component = context.construct(Component, {
      foo: {
        bar: 'value'
      }
    })
    component = await context.defineComponent(component)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    let nextComponent = context.construct(Component, {
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
    let component = context.construct(Component, {
      foo: {
        bar: 'value'
      }
    })
    component = await context.defineComponent(component, null)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    let nextComponent = context.construct(Component, {
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
    let component = context.construct(Component, {
      components: {
        foo: context.construct(Component, {})
      }
    })
    component = await context.defineComponent(component)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    let nextComponent = context.construct(Component, {
      components: {
        foo: context.construct(Component, {})
      }
    })
    nextComponent = await context.defineComponent(nextComponent, prevComponent)
    nextComponent = resolveComponentEvaluables(nextComponent)

    const result = nextComponent.shouldDeploy(prevComponent, context)

    expect(result).toBe(undefined)
  })

  it('should generate an instanceId on construct', async () => {
    const component = context.construct(Component, {})
    expect(typeof component.instanceId).toBe('string')
  })

  it('should preserve instanceId on hydrate', async () => {
    let component = context.construct(Component, {})
    component = await context.defineComponent(component)
    component = resolveComponentEvaluables(component)
    await component.deploy(null, context)

    const prevComponent = await deserialize(serialize(component, context), context)

    const nextComponent = context.construct(Component, {})
    nextComponent.hydrate(prevComponent, context)

    expect(nextComponent.instanceId).toBe(prevComponent.instanceId)
  })
})
