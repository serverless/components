import newVariable from '../variable/newVariable'
import walkReduceVariables from './walkReduceVariables'

describe('#walkReduceVariables()', () => {
  it('should resolve variables when it is referenced twice', async () => {
    const fooVariable = newVariable('${foo}', { foo: 'foo' })
    const component = {
      foo: fooVariable,
      bar: fooVariable
    }

    const result = walkReduceVariables(
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
        keys: ['bar'],
        value: fooVariable
      }
    ])
  })

  it('should prevent walking circular references', async () => {
    const fooVariable = newVariable('${foo}', { foo: 'foo' })
    const component = {
      foo: fooVariable
    }

    component.bar = component
    const result = walkReduceVariables(
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
      }
    ])
  })
})
