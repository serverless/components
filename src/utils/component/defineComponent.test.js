import path from 'path'
import { keys, prop } from '@serverless/utils'
import defineComponent from './defineComponent'
import { createTestContext } from '../../../test'

describe('#defineComponent()', () => {
  const cwd = path.resolve(__dirname, '..')
  const state = {}
  let context
  let Component
  let Object

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    Component = await context.import('Component')
    Object = await context.import('Object')
  })

  it('should throw if the passed-in component is not of type Component', async () => {
    const object = context.construct(Object, state, context)

    // TODO: rewrite to use `await expect toThrow`
    // for more info see: https://github.com/facebook/jest/issues/1377
    try {
      await defineComponent(object, state, context)
    } catch (error) {
      expect(error.message).toMatch(/expected component parameter to be a component/)
    }
  })

  describe('when running the components "define" function', async () => {
    let component

    beforeEach(async () => {
      component = context.construct(Component, state, context)
    })

    it('should return component instances based on the passed-in object structure', async () => {
      component.define = () => ({
        component1: {
          type: '../../registry/Component',
          inputs: {}
        },
        components: {
          component2: {
            type: '../../registry/Component',
            inputs: {}
          }
        },
        functions: {
          function1: {
            type: '../../registry/Component',
            inputs: {}
          },
          function2: {
            type: '../../registry/Component',
            inputs: {}
          }
        },
        arrayProp: [
          { component3: { type: '../../registry/Component', inputs: {} } },
          { component4: { type: '../../registry/Component', inputs: {} } }
        ]
      })

      const res = await defineComponent(component, state, context)

      expect(res).toBeInstanceOf(Component.class)
      expect(keys(prop('children', res))).toHaveLength(4)
      expect(res.children.component1).toBeInstanceOf(Component.class)
      expect(res.children.components.component2).toBeInstanceOf(Component.class)
      expect(res.children.functions.function1).toBeInstanceOf(Component.class)
      expect(res.children.functions.function2).toBeInstanceOf(Component.class)
      expect(res.children.functions.function2).toBeInstanceOf(Component.class)
      expect(res.children.arrayProp[0].component3).toBeInstanceOf(Component.class)
      expect(res.children.arrayProp[1].component4).toBeInstanceOf(Component.class)
    })

    it('should support the mix of "type" / "inputs", loaded types and instance definitions', async () => {
      const instance = context.construct(Component, state, context)
      component.define = () => ({
        component1: instance,
        component2: {
          type: Component,
          inputs: {}
        },
        component3: {
          type: '../../registry/Component',
          inputs: {}
        }
      })

      const res = await defineComponent(component, state, context)

      expect(keys(prop('children', res))).toHaveLength(3)
      expect(res.children.component1).toBeInstanceOf(Component.class)
      expect(res.children.component2).toBeInstanceOf(Component.class)
      expect(res.children.component3).toBeInstanceOf(Component.class)
    })

    it('should only resolve components one level deep', async () => {
      component.define = () => ({
        myComponent1: {
          type: '../../registry/Component',
          inputs: {},
          myComponent2: {
            type: '../../registry/Component',
            inputs: {}
          }
        }
      })

      const res = await defineComponent(component, state, context)

      // NOTE: this Object was extended above to be our customized Component
      expect(res).toBeInstanceOf(Object.class)
      expect(keys(prop('children', res))).toHaveLength(1)
      expect(res.children.myComponent1).toBeInstanceOf(Component.class)
      expect(res.children.myComponent1.myComponent2).toBeUndefined()
    })
  })
})
