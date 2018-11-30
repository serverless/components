import createContext from '../context/createContext'
import newVariable from '../variable/newVariable'
import walkReduceComponentOwnVariables from './walkReduceComponentOwnVariables'

describe('#walkReduceComponentOwnVariables()', () => {
  it('walk reduce component variables', async () => {
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const Component = await context.import('Component')
    const component = await context.construct(Component, {})
    const fooVariable = newVariable('${foo}', { foo: 'foo' })
    const barVariable = newVariable('${bar}', { bar: 'bar' })
    const bazVariable = newVariable('${baz}', { baz: 'baz' })
    component.foo = fooVariable
    component.bar = { var: barVariable }
    component.baz = [bazVariable]

    const result = walkReduceComponentOwnVariables(
      (accum, value, keys) => {
        accum.push({ value, keys })
        return accum
      },
      [],
      component
    )
    expect(result).toEqual([
      {
        keys: ['foo'],
        value: fooVariable
      },
      {
        keys: ['bar', 'var'],
        value: barVariable
      },
      {
        keys: ['baz', 0],
        value: bazVariable
      }
    ])
  })
})
