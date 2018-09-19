import newContext from './newContext'

describe('#newContext()', () => {
  it('accepts propety values', () => {
    const context = newContext({
      cache: {},
      cwd: '/test/dir',
      data: {},
      registry: 'https://registry.com',
      root: '/test/root'
    })
    expect(context).toEqual({
      cache: {},
      construct: expect.any(Function),
      cwd: '/test/dir',
      data: {},
      get: expect.any(Function),
      loadType: expect.any(Function),
      merge: expect.any(Function),
      registry: 'https://registry.com',
      root: '/test/root',
      set: expect.any(Function)
    })
  })
})
