import createContext from '../context/createContext'
import newVariable from '../variable/newVariable'
import getVariableInstanceIds from './getVariableInstanceIds'

describe('#getVariableInstanceIds()', () => {
  it('get variable component instance ids', async () => {
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
    const fooComponent = await context.construct(Component, {})
    const barComponent = await context.construct(Component, {})
    const bazComponent = await context.construct(Component, {})

    const data = {
      foo: fooComponent,
      bar: barComponent,
      baz: bazComponent
    }
    const fooVariable = newVariable('${data.foo}', { data })
    const barVariable = newVariable('${data.bar}', { data })
    const bazVariable = newVariable('${data.baz}', { data })

    component.foo = fooVariable
    component.bar = { var: barVariable }
    component.baz = [bazVariable]

    const result = getVariableInstanceIds(component)
    expect(result).toEqual([
      fooComponent.instanceId,
      barComponent.instanceId,
      bazComponent.instanceId
    ])
  })
})
