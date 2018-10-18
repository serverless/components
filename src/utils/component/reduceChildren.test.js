import createContext from '../context/createContext'
import reduceChildren from './reduceChildren'

describe('#reduceChildren()', () => {
  it('reduces single component with no children', async () => {
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const Component = await context.loadType('Component')
    const component = await context.construct(Component, {})
    const result = reduceChildren((accum, child) => accum.push(child), [], component)
    expect(result).toEqual([])
  })

  it('throws an error if component parameter is not a Component', async () => {
    expect(() => {
      reduceChildren((accum, child) => accum.push(child), [], {})
    }).toThrow(/^reduceChildren expected to receive a component/)
  })

  it('throws an error if component parameter is not a Component', async () => {
    expect(() => {
      reduceChildren((accum, child) => accum.push(child), [], {})
    }).toThrow(/^reduceChildren expected to receive a component/)
  })
})
