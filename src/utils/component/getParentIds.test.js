import createContext from '../context/createContext'
import getParentIds from './getParentIds'

describe('#getParentIds()', () => {
  it("should return an array of all the component's parent's ids", async () => {
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const Component = await context.import('Component')
    const grandparent = context.construct(Component, {})
    const parent = context.construct(Component, {})
    const child = context.construct(Component, {})
    parent.parent = grandparent
    child.parent = parent

    expect(getParentIds(child)).toEqual([parent.instanceId, grandparent.instanceId])
  })

  it('returns an empty array when parent is undefined', async () => {
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const Component = await context.import('Component')
    const component = context.construct(Component, {})

    expect(getParentIds(component)).toEqual([])
  })
})
