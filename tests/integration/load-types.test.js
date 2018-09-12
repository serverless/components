import { createContext, loadType } from '../../src/utils'

describe('Integration Test - load types', () => {
  // it('should load a type using registry query', async () => {
  //
  //   const context
  //   const type = await loadType('foo@1.0.0')
  //   expect(type).toEqual(true)
  // })

  it('should load a type using a file path', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const type = await loadType('./load-types/Foo', context)
    expect(type).toEqual({
      name: 'Foo',
      main: './index.js'
    })
  })
})
