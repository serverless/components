import createContext from '../context/createContext'
import Base from './Base'
import buildTypeClass from './buildTypeClass'

describe('#buildTypeClass()', () => {
  it('should default to Base as parent class', async () => {
    const context = await createContext({})
    const def = {
      main: {
        foo() {}
      },
      props: {
        name: 'Test'
      }
    }
    const TypeClass = buildTypeClass(def, context)
    expect(TypeClass.name).toBe('Test')
    expect(TypeClass.prototype).toEqual({
      foo: expect.any(Function)
    })
    const instance = new TypeClass()
    expect(instance).toBeInstanceOf(Base)
  })
})
