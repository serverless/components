import createContext from '../context/createContext'
import loadType from './loadType'
import requireType from './requireType'

describe('#requireType()', () => {
  it('should require a loaded type', async () => {
    const context = await createContext({})
    const Component = await loadType('Component', context)
    const requiredComponent = requireType('Component', context)
    expect(requiredComponent).toBe(Component)
  })
})
