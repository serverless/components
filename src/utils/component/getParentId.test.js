import createContext from '../context/createContext'
import getParentId from './getParentId'

describe('#getParentId()', () => {
  it("should return the component's parent's id", async () => {
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const Component = await context.import('Component')
    const parent = context.construct(Component, {})
    const child = context.construct(Component, {})
    child.parent = parent

    expect(getParentId(child)).toBe(parent.instanceId)
  })

  it('returns undefined when parent is undefined', async () => {
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

    expect(getParentId(component)).toBe(null)
  })
})
