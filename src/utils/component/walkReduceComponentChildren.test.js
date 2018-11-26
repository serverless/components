import path from 'path'
import { createTestContext } from '../../../test'
import walkReduceComponentChildren from './walkReduceComponentChildren'

describe('#walkReduceComponentChildren()', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let Component

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    Component = await context.import('Component')
  })

  it('should walk reduce the component and components children defined via an object', async () => {
    const component = context.construct(Component, {})
    const child = context.construct(Component, {})

    component.children = {
      nested1: {
        child1: child,
        nested2: {
          child2: child
        }
      },
      child3: child,
      arrayProp: [{ child4: child }],
      child5: child
    }

    const result = walkReduceComponentChildren(
      (accum, value, keys) => {
        accum.push(keys)
        return accum
      },
      [],
      component
    )

    expect(result).toEqual([
      ['children', 'nested1', 'child1'],
      ['children', 'nested1', 'nested2', 'child2'],
      ['children', 'child3'],
      ['children', 'arrayProp', 0, 'child4'],
      ['children', 'child5']
    ])
  })

  it('should walk reduce the component and components children defined via an array', async () => {
    const component = context.construct(Component, {})
    const child = context.construct(Component, {})

    component.children = [
      {
        nested1: {
          child1: child,
          nested2: {
            child2: child
          }
        }
      },
      {
        child3: child
      },
      {
        arrayProp: [{ child4: child }]
      },
      {
        child5: child
      }
    ]

    const result = walkReduceComponentChildren(
      (accum, value, keys) => {
        accum.push(keys)
        return accum
      },
      [],
      component
    )

    expect(result).toEqual([
      ['children', 0, 'nested1', 'child1'],
      ['children', 0, 'nested1', 'nested2', 'child2'],
      ['children', 1, 'child3'],
      ['children', 2, 'arrayProp', 0, 'child4'],
      ['children', 3, 'child5']
    ])
  })
})
