import createContext from '../context/createContext'
import loadType from './loadType'

describe('#loadType()', () => {
  let context

  beforeEach(async () => {
    context = await createContext()
  })

  it('should load type by name', async () => {
    const Component = await loadType('Component', context)
    expect(Component).toEqual(expect.any(Object))
  })

  it('should return the type if it was already loaded', async () => {
    const Component = await context.import('Component')

    const res = await loadType(Component, context)
    expect(res).toEqual(Component)
  })
})
