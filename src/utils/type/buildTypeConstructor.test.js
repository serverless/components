import { SYMBOL_TYPE } from '../constants'
import createContext from '../context/createContext'
import buildTypeConstructor from './buildTypeConstructor'

describe('#buildTypeConstructor()', () => {
  it('constructor should set @@type when constructing an instance', async () => {
    const context = await createContext({})
    const type = {
      main: {
        foo() {}
      },
      props: {
        name: 'Test'
      },
      class: class {}
    }
    const constructor = buildTypeConstructor(type, context)
    expect(constructor).toBeInstanceOf(Function)

    const inputs = {}
    const instance = await new constructor(inputs, context, type)

    expect(instance[SYMBOL_TYPE]).toBe(type)
  })

  it('constructor supports construct method', async () => {
    const Class = class {}
    const context = await createContext({})
    const inputs = { foo: 'bar' }
    const type = {
      main: {
        construct(inputs, context) {
          expect(inputs).toBe(inputs)
          expect(context).toBe(context)
          expect(this).toEqual({
            name: 'Test',
            [SYMBOL_TYPE]: type
          })
          this.ran = true
        }
      },
      props: {
        name: 'Test'
      },
      class: Class
    }
    const constructor = buildTypeConstructor(type, context)
    const instance = await new constructor(inputs, context, type)

    expect(instance.ran).toBe(true)
  })

  it('instantiates type constructions in props', async () => {
    const Test1Type = {
      main: {
        construct(inputs, context) {
          expect(inputs).toEqual({
            foo1: 'bar1'
          })
          this.foo1 = inputs.foo1
        }
      },
      props: {
        foo1: null
      },
      class: class {}
    }
    Test1Type.constructor = buildTypeConstructor(Test1Type)

    const Test2Type = {
      main: {
        construct(inputs, context) {
          expect(inputs).toEqual({
            foo2: 'bar2'
          })
          this.foo2 = inputs.foo2
        }
      },
      props: {
        foo2: null
      },
      class: class {}
    }
    Test2Type.constructor = buildTypeConstructor(Test2Type)

    const context = await createContext({})
    context.loadType = async (query, context) => {
      if (query === 'Test1') {
        return Test1Type
      } else if (query === 'Test2') {
        return Test2Type
      }
      throw new Error(`unknown query ${query}`)
    }

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
    const constructor = buildTypeConstructor(MainType, context)
    const instance = await new constructor({}, context, MainType)

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
