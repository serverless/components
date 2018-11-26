import { createTestContext } from '../../test'

jest.setTimeout(50000)

describe('Integration Test - define types', () => {
  const state = {}
  let context

  beforeEach(async () => {
    context = await createTestContext({
      cwd: __dirname
    })
  })

  it('should load the Object type by name', async () => {
    const ObjectType = await context.import('Object')
    expect(ObjectType).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: {
        construct: expect.any(Function),
        clone: expect.any(Function),
        getType: expect.any(Function)
      },
      parent: undefined,
      props: {
        main: './dist/index.js',
        name: 'Object',
        version: '0.3.0'
      },
      query: 'Object',
      root: expect.stringMatching(/^.*Object$/)
    })
  })

  it('should create component instances at every property level', async () => {
    const Parent = await context.import('./define-types/Parent')
    const Child = await context.import('./define-types/Child')
    const instance = context.construct(Parent, state, context)

    expect(instance.components.childA).toBeInstanceOf(Child.class)
    expect(instance.components.childB).toBeInstanceOf(Child.class)
    expect(instance.objectProp.childC).toBeInstanceOf(Child.class)
    expect(instance.arrayProp[0].childD).toBeInstanceOf(Child.class)
    expect(instance.deeply.nested.childs.childE).toBeInstanceOf(Child.class)
  })

  it('should store all component instances at the "children" property based on their respective levels', async () => {
    const Parent = await context.import('./define-types/Parent')
    const Child = await context.import('./define-types/Child')
    let instance = context.construct(Parent, state, context)

    instance = await context.defineComponent(instance, state, context)

    expect(instance.children.components.childA).toBeInstanceOf(Child.class)
    expect(instance.children.components.childB).toBeInstanceOf(Child.class)
    expect(instance.children.objectProp.childC).toBeInstanceOf(Child.class)
    expect(instance.children.arrayProp[0].childD).toBeInstanceOf(Child.class)
    expect(instance.children.deeply.nested.childs.childE).toBeInstanceOf(Child.class)
  })
})
