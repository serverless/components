import { createContext, SYMBOL_TYPE } from '../../src/utils'

jest.setTimeout(50000)

describe('Integration Test - define types', () => {
  it('should load the Object type by name', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const ObjectType = await context.loadType('Object')
    expect(ObjectType).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: {
        construct: expect.any(Function),
        getType: expect.any(Function)
      },
      parent: undefined,
      props: {
        main: './index.js',
        name: 'Object',
        version: '1.0.0'
      },
      root: expect.stringMatching(/^.*Object$/)
    })
  })
})
