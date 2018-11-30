import createContext from '../context/createContext'
import getComponentReferenceIds from './getComponentReferenceIds'

describe('#getComponentReferenceIds()', () => {
  it('get component reference ids', async () => {
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

    component.foo = fooComponent
    component.bar = { var: barComponent }
    component.baz = [bazComponent]

    const result = getComponentReferenceIds(component)
    expect(result).toEqual([
      fooComponent.instanceId,
      barComponent.instanceId,
      bazComponent.instanceId
    ])
  })
})
