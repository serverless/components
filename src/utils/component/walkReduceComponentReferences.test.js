import createTestContext from '../../../test/createTestContext'
import walkReduceComponentReferences from './walkReduceComponentReferences'

describe('#walkReduceComponentReferences()', () => {
  it('walk reduce component references', async () => {
    const context = await createTestContext()
    const Component = await context.import('Component')
    const component = context.construct(Component, {})
    const fooComponent = context.construct(Component, {})
    const barComponent = context.construct(Component, {})
    const bazComponent = context.construct(Component, {})
    component.foo = fooComponent
    component.bar = { var: barComponent }
    component.baz = [bazComponent]

    const result = walkReduceComponentReferences(
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
        value: fooComponent
      },
      {
        keys: ['bar', 'var'],
        value: barComponent
      },
      {
        keys: ['baz', 0],
        value: bazComponent
      }
    ])
  })
})
