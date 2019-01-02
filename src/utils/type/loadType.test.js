import createContext from '../context/createContext'
import loadType from './loadType'

describe('#loadType()', () => {
  it('should load type by name', async () => {
    const context = await createContext({})
    const Component = await loadType('Component', context)
    expect(Component).toEqual(expect.any(Object))
  })
})
