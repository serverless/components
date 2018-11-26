import resolveComponentEvaluables from '../component/resolveComponentEvaluables'
import createContext from '../context/createContext'
import deserialize from './deserialize'
import serialize from './serialize'

describe('deserialize', () => {
  it('deserialize a simple empty component', async () => {
    const component = {
      instanceId: 'foo'
    }
    const context = {}
    const serialized = serialize(component, context)
    const result = await deserialize(serialized, context)
    expect(result).toEqual(component)
  })

  it('deserialize a simple nested object', async () => {
    const component = {
      instanceId: 'foo',
      bar: {
        baz: 'bop'
      }
    }
    const context = {}
    const serialized = serialize(component, context)
    const result = await deserialize(serialized, context)
    expect(result).toEqual(component)
  })

  it('deserialize a simple circular reference', async () => {
    const component = {
      instanceId: 'foo',
      bar: {}
    }
    component.bar.foo = component

    const context = {}
    const serialized = serialize(component, context)
    const result = await deserialize(serialized, context)
    expect(result).toEqual(component)
  })

  it('deserialize a double reference', async () => {
    const component = {
      instanceId: 'foo',
      bar: {
        baz: 'bop'
      }
    }
    component.foo = component.bar

    const context = {}
    const serialized = serialize(component, context)
    const result = await deserialize(serialized, context)
    expect(result).toEqual(component)
  })

  it('deserialize a simple symbol component', async () => {
    const symFoo = Symbol('foo')
    const component = {
      instanceId: 'foo',
      [symFoo]: {
        foo: 'bar'
      }
    }
    const context = {
      log: () => {},
      symbolMap: {
        [symFoo]: '@@foo'
      }
    }
    const serialized = serialize(component, context)
    const result = await deserialize(serialized, context)
    expect(result).toEqual(component)
  })

  it('deserialize a simple component', async () => {
    const context = await createContext({}, { app: { id: 'test' } })
    const Component = await context.import('Component')
    const component = await context.construct(Component, {})
    component.instanceId = 'test'
    const serialized = serialize(component, context)
    const result = await deserialize(serialized, context)
    expect(result).toEqual(resolveComponentEvaluables(component))
  })
})
