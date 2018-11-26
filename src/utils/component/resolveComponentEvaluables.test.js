import createContext from '../context/createContext'
import newVariable from '../variable/newVariable'
import resolveComponentEvaluables from './resolveComponentEvaluables'

describe('#resolveComponentEvaluables()', () => {
  it('resolve component variables', async () => {
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const Component = await context.import('Component')
    const parentComponent = await context.construct(Component, {})
    const componentA = await context.construct(Component, {})
    const componentB = await context.construct(Component, {})
    parentComponent.children = {
      a: componentA,
      b: componentB
    }
    componentA.parent = parentComponent
    componentB.parent = parentComponent

    const cVariable = newVariable('${c}', { c: 'abc' })
    parentComponent.b = componentB
    parentComponent.c = { cVar: cVariable }

    const fooVariable = newVariable('${foo}', { foo: 'foo' })
    const barVariable = newVariable('${bar}', { bar: 'bar' })
    const bazVariable = newVariable('${baz}', { baz: 'baz' })
    const compBVariable = newVariable('${this.b}', { this: parentComponent })
    const refCVariable = newVariable('${this.c}', { this: parentComponent })

    componentA.foo = fooVariable
    componentA.bar = { var: barVariable }
    componentA.baz = [bazVariable]
    componentA.b = compBVariable
    componentA.c = refCVariable

    const ignoreVariable = newVariable('${ignore}', { ignore: false })
    componentB.ignore = ignoreVariable

    const result = resolveComponentEvaluables(componentA)
    expect(result).toMatchObject({
      foo: 'foo',
      bar: { var: 'bar' },
      baz: ['baz'],
      c: {
        cVar: 'abc'
      }
    })

    expect(result.b).toBe(componentB)

    expect(componentB).toMatchObject({
      ignore: {
        resolve: expect.any(Function)
      }
    })
  })
})
