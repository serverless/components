import createContext from './createContext'

describe('#createContext()', () => {
  it('defaults cwd to process.cwd', async () => {
    const context = await createContext({})
    expect(context.cwd).toBe(process.cwd())
  })

  it('accepts known options', async () => {
    const options = {
      cwd: '/test/dir',
      loaders: { bim: 'bop' },
      project: '/project/dir',
      types: { foo: 'bar' }
    }
    const context = await createContext(options)
    expect(context).toMatchObject({
      cwd: '/test/dir',
      loaders: { bim: 'bop' },
      types: { foo: 'bar' },
      options
    })
  })
})
