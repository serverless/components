import newContext from './newContext'

describe('#newContext()', () => {
  it('accepts propety values', () => {
    const context = newContext({
      cache: {},
      cwd: '/test/dir',
      data: {},
      registry: 'https://registry.com',
      root: '/test/root',
      Type: { foo: 'bar' }
    })
    expect(context).toEqual({
      cache: {},
      construct: expect.any(Function),
      cwd: '/test/dir',
      data: {},
      get: expect.any(Function),
      loadType: expect.any(Function),
      log: expect.any(Function),
      merge: expect.any(Function),
      registry: 'https://registry.com',
      root: '/test/root',
      set: expect.any(Function),
      Type: { foo: 'bar' }
    })
  }),
    it('overrides are spread across context', () => {
      const context = newContext({
        cache: {},
        cwd: '/test/dir',
        data: {},
        registry: 'https://registry.com',
        root: '/test/root',
        Type: { foo: 'bar' },
        overrides: {
          cwd: '/override/dir',
          foo: 'bar'
        }
      })
      expect(context).toEqual({
        cache: {},
        construct: expect.any(Function),
        cwd: '/override/dir',
        data: {},
        foo: 'bar',
        get: expect.any(Function),
        loadType: expect.any(Function),
        log: expect.any(Function),
        merge: expect.any(Function),
        overrides: {
          cwd: '/override/dir',
          foo: 'bar'
        },
        registry: 'https://registry.com',
        root: '/test/root',
        set: expect.any(Function),
        Type: { foo: 'bar' }
      })
    })
})
