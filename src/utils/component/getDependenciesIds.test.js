import createContext from '../context/createContext'
import newVariable from '../variable/newVariable'
import getDependenciesIds from './getDependenciesIds'

describe('#getDependenciesIds()', () => {
  it('get component dependency ids', async () => {
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const Component = await context.import('Component')
    const parentComponent = context.construct(Component, {})
    const component = context.construct(Component, {})
    const childComponent = context.construct(Component, {})
    const fooComponent = context.construct(Component, {})
    const barComponent = context.construct(Component, {})
    const bazComponent = context.construct(Component, {})
    const bimComponent = context.construct(Component, {})

    parentComponent.children = {
      child: component
    }
    component.parent = parentComponent
    component.children = [childComponent]
    childComponent.parent = component

    component.foo = fooComponent
    component.bar = { var: barComponent }
    component.baz = [bazComponent]

    parentComponent.bim = bimComponent
    parentComponent.bar = barComponent
    parentComponent.baz = bazComponent

    const bimVariable = newVariable('${this.bim}', { this: parentComponent })
    const barVariable = newVariable('${this.bar}', { this: parentComponent })
    const bazVariable = newVariable('${this.baz}', { this: parentComponent })

    component.bimVar = bimVariable
    component.barVar = { var: barVariable }
    component.bazVar = [bazVariable]

    const result = getDependenciesIds(component)
    expect(result).toEqual(
      expect.arrayContaining([
        fooComponent.instanceId,
        barComponent.instanceId,
        bazComponent.instanceId,
        bimComponent.instanceId,
        childComponent.instanceId
      ])
    )
  })
})
