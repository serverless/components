import createContext from '../context/createContext'
import serialize from './serialize'

describe('#serialize()', () => {
  it('serialize a simple empty component', async () => {
    const component = {
      instanceId: 'foo'
    }
    const context = {}
    const result = serialize(component, context)
    expect(result).toEqual({
      entryKey: '@@ref-1',
      referenceables: {
        '@@ref-1': {
          props: {
            instanceId: {
              data: 'foo',
              type: 'string'
            }
          },
          symbols: {},
          type: 'object'
        }
      }
    })
  })

  it('serialize a simple symbol component', async () => {
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
    const result = serialize(component, context)
    expect(result).toEqual({
      entryKey: '@@ref-1',
      referenceables: {
        '@@ref-1': {
          props: {
            instanceId: {
              data: 'foo',
              type: 'string'
            }
          },
          symbols: {
            '@@foo': {
              '@@ref': '@@ref-2'
            }
          },
          type: 'object'
        },
        '@@ref-2': {
          props: {
            foo: {
              data: 'bar',
              type: 'string'
            }
          },
          symbols: {},
          type: 'object'
        }
      }
    })
  })

  it('serialize a simple component', async () => {
    const context = await createContext({}, { app: { id: 'test' } })
    const Component = await context.import('Component')
    const component = await context.construct(Component, {})
    component.instanceId = 'test'
    const result = serialize(component, context)
    expect(result).toMatchSnapshot()
  })
})
