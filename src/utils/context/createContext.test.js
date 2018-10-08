import createContext from './createContext'

describe('#createContext()', () => {
  it('defaults cwd to process.cwd', async () => {
    const context = await createContext({})
    expect(context.cwd).toBe(process.cwd())
  })

  it('accepts known options', async () => {
    const options = {
      cwd: '/test/dir',
      project: '/project/dir'
    }
    const context = await createContext(options)
    expect(context).toMatchObject({
      cwd: '/test/dir',
      options
    })
  })
})
