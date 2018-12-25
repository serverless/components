import createContext from '../context/createContext'
import buildTypeConstructor from './utils/buildTypeConstructor'
import construct from './construct'

describe('#construct()', () => {
  it('should construct the constructor', async () => {
    const context = await createContext({})
    const Type = {
      props: {
        name: 'Test'
      },
      class: class {
        construct(inpt, ctx) {
          this.inputs = inpt
          this.context = ctx
        }
      }
    }
    Type.constructor = buildTypeConstructor(Type, context)
    const inputs = {}
    const result = construct(Type, inputs, context)
    expect(result).toBeInstanceOf(Type.constructor)
    expect(result.inputs).toBe(inputs)
    expect(result.context).toMatchObject({
      Type
    })
  })
})
