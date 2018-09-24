import createContext from '../context/createContext'
import defType from './defType'
import loadType from './loadType'

describe('#defType()', () => {
  it('should default to Object as the parent type if extends property is not set', async () => {
    const context = await createContext({})
    const type = {
      root: './test',
      props: {
        name: 'Test'
      }
    }
    const ObjectType = await loadType('Object', context)
    const Type = await defType(type, context)
    expect(Type).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: expect.any(Function),
      parent: ObjectType,
      props: {
        extends: 'Object',
        name: 'Test'
      },
      root: './test'
    })
  })
})
