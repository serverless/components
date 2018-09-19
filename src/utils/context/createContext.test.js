import createContext from './createContext'

describe('#createContext()', () => {
  it('defaults cwd to process.cwd', async () => {
    const context = await createContext({})
    expect(context.cwd).toBe(process.cwd())
  })

  it('accepts known options', async () => {
    const context = await createContext({
      cwd: '/test/dir'
    })
    expect(context).toEqual({
      construct: expect.any(Function),
      cwd: '/test/dir',
      get: expect.any(Function),
      loadType: expect.any(Function),
      merge: expect.any(Function),
      set: expect.any(Function)
    })
  })
})
