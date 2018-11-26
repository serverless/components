import { SYMBOL_TYPE, SYMBOL_VARIABLE } from '../constants'
import createContext from '../context/createContext'
import buildTypeConstructor from './buildTypeConstructor'

describe('#buildTypeConstructor()', () => {
  it('constructor should set @@type when constructing an instance', async () => {
    let context = await createContext({})
    const Type = {
      main: {
        foo() {}
      },
      props: {
        name: 'Test'
      },
      class: class {}
    }
    Type.constructor = buildTypeConstructor(Type, context)
    expect(Type.constructor).toBeInstanceOf(Function)

    const inputs = {}
    context = context.merge({ Type })
    const instance = await new Type.constructor(inputs, context)

    expect(instance[SYMBOL_TYPE]).toBe(Type)
  })

  it('constructor instance is instanceof both constructor and class', async () => {
    let context = await createContext({})
    const Type = {
      main: {
        foo() {}
      },
      props: {
        name: 'Test'
      },
      class: class {}
    }
    Type.constructor = buildTypeConstructor(Type, context)
    expect(Type.constructor).toBeInstanceOf(Function)

    const inputs = {}
    context = context.merge({ Type })
    const instance = await new Type.constructor(inputs, context)

    expect(instance).toBeInstanceOf(Type.constructor)
    expect(instance).toBeInstanceOf(Type.class)
  })

  it('constructor calls class constructor', async () => {
    let context = await createContext({})
    const inputs = { foo: 'bar' }
    const Class = class {
      constructor(inpt, ctx) {
        expect(inpt).toBe(inputs)
        expect(ctx).toMatchObject({
          Type: undefined
        })
        this.ran = true
      }
    }
    const Type = {
      main: {},
      props: {
        name: 'Test'
      },
      class: Class
    }
    Type.constructor = buildTypeConstructor(Type, context)
    context = context.merge({ Type })
    const instance = await new Type.constructor(inputs, context)

    expect(instance).toEqual({
      name: 'Test',
      ran: true,
      [SYMBOL_TYPE]: Type
    })
  })

  it('constructor supports construct method', async () => {
    let context = await createContext({})
    const inputs = { foo: 'bar' }
    const Type = {
      props: {
        name: 'Test'
      }
    }
    const Class = class {
      async construct(inpt, ctx) {
        expect(inpt).toBe(inputs)
        expect(ctx).toBe(context)
        expect(this).toEqual({
          name: 'Test',
          [SYMBOL_TYPE]: Type
        })
        this.ran = true
      }
    }
    Type.class = Class
    Type.constructor = buildTypeConstructor(Type, context)
    context = context.merge({ Type })
    const instance = await new Type.constructor(inputs, context)

    expect(instance).toEqual({
      name: 'Test',
      [SYMBOL_TYPE]: Type
    })
  })

  it('supports interpreting variables from properties', async () => {
    const Class = class {}
    let context = await createContext({})
    const inputs = { foo: 'bar' }
    const Type = {
      main: {},
      props: {
        name: 'Test',
        foo: '${inputs.foo}'
      },
      class: Class
    }
    Type.constructor = buildTypeConstructor(Type, context)
    context = context.merge({ Type })
    const instance = await new Type.constructor(inputs, context)

    expect(instance).toEqual({
      name: 'Test',
      foo: expect.objectContaining({
        [SYMBOL_VARIABLE]: true
      }),
      [SYMBOL_TYPE]: Type
    })
  })

  it('instantiates type constructions in props', async () => {
    const Test1Type = {
      props: {
        foo1: null
      },
      class: class {
        async construct(inputs) {
          expect(inputs).toEqual({
            foo1: 'bar1'
          })
          this.foo1 = inputs.foo1
        }
      }
    }
    Test1Type.constructor = buildTypeConstructor(Test1Type)

    const Test2Type = {
      props: {
        foo2: null
      },
      class: class {
        async construct(inputs) {
          expect(inputs).toEqual({
            foo2: 'bar2'
          })
          this.foo2 = inputs.foo2
        }
      }
    }
    Test2Type.constructor = buildTypeConstructor(Test2Type)

    let context = await createContext({
      overrides: {
        import: async (query) => {
          if (query === 'Test1') {
            return Test1Type
          } else if (query === 'Test2') {
            return Test2Type
          }
          throw new Error(`unknown query ${query}`)
        }
      }
    })

    const MainType = {
      props: {
        testArray: [
          {
            type: 'Test1',
            inputs: {
              foo1: 'bar1'
            }
          },
          {
            type: 'Test2',
            inputs: {
              foo2: 'bar2'
            }
          }
        ]
      },
      class: class {}
    }
    MainType.constructor = buildTypeConstructor(MainType, context)
    context = context.merge({ Type: MainType })
    const instance = await new MainType.constructor({}, context)

    expect(instance).toEqual({
      testArray: [
        {
          foo1: 'bar1',
          [SYMBOL_TYPE]: Test1Type
        },
        {
          foo2: 'bar2',
          [SYMBOL_TYPE]: Test2Type
        }
      ],
      [SYMBOL_TYPE]: MainType
    })
  })
})
