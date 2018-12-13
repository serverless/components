import { createContext } from '../../src/utils'

jest.setTimeout(50000)

describe('Integration Test - define types', () => {
  it('should load the Object type by name', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const ObjectType = await context.import('Object')
    expect(ObjectType).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: {
        construct: expect.any(Function),
        clone: expect.any(Function),
        getType: expect.any(Function)
      },
      parent: undefined,
      props: {
        main: './dist/index.js',
        name: 'Object',
        version: '0.3.0'
      },
      query: 'Object',
      root: expect.stringMatching(/^.*Object$/)
    })
  })
})
