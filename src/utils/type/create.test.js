import { SYMBOL_TYPE } from '../constants'
import createContext from '../context/createContext'
import buildTypeConstructor from './utils/buildTypeConstructor'
import create from './create'

describe('#create()', () => {
  it('should create and object of type constructor', async () => {
    const context = await createContext({})
    const Type = {
      props: {
        name: 'Test'
      },
      class: class {}
    }
    Type.constructor = buildTypeConstructor(Type, context)
    const result = create(Type, {})
    expect(result).toBeInstanceOf(Type.constructor)
  })

  it('should set the SYMBOL_TYPE', async () => {
    const context = await createContext({})
    const Type = {
      props: {
        name: 'Test'
      },
      class: class {}
    }
    Type.constructor = buildTypeConstructor(Type, context)
    const result = create(Type, {})
    expect(result[SYMBOL_TYPE]).toBe(Type)
  })

  it('should create and object but not call construct', async () => {
    const context = await createContext({})
    const Type = {
      props: {
        name: 'Test'
      },
      class: class {
        construct() {
          this.called = true
        }
      }
    }
    Type.constructor = buildTypeConstructor(Type, context)
    const result = create(Type, {})
    expect(result.called).toBe(undefined)
  })

  it('should merge props into new instance', async () => {
    const context = await createContext({})
    const Type = {
      props: {
        name: 'Test'
      },
      class: class {}
    }
    Type.constructor = buildTypeConstructor(Type, context)
    const props = { foo: 'bar' }
    const result = create(Type, props)
    expect(result).toEqual({
      foo: 'bar',
      [SYMBOL_TYPE]: Type
    })
  })
})
