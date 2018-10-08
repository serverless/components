import newContext from './newContext'

describe('#newContext()', () => {
  it('accepts all configurable propety values', () => {
    const context = newContext({
      app: {},
      cache: {},
      cwd: '/test/dir',
      data: {},
      deployment: {},
      options: {
        project: '/project/path'
      },
      plugins: {},
      project: {},
      registry: 'https://registry.com',
      root: '/test/root',
      state: {},
      Type: { foo: 'bar' }
    })
    expect(context).toEqual({
      app: {},
      cache: {},
      construct: expect.any(Function),
      createDeployment: expect.any(Function),
      cwd: '/test/dir',
      data: {},
      defineComponent: expect.any(Function),
      defineComponentFromState: expect.any(Function),
      deployment: {},
      get: expect.any(Function),
      getState: expect.any(Function),
      loadApp: expect.any(Function),
      loadPlugins: expect.any(Function),
      loadPreviousDeployment: expect.any(Function),
      loadState: expect.any(Function),
      loadType: expect.any(Function),
      log: expect.any(Function),
      merge: expect.any(Function),
      options: {
        project: '/project/path'
      },
      plugins: {},
      project: {},
      registry: 'https://registry.com',
      root: '/test/root',
      saveState: expect.any(Function),
      set: expect.any(Function),
      state: {},
      Type: { foo: 'bar' }
    })
  })

  it('overrides are spread across context and overwrite values', () => {
    const context = newContext({
      cwd: '/test/dir',
      overrides: {
        cwd: '/override/dir',
        foo: 'bar'
      }
    })
    expect(context).toMatchObject({
      cwd: '/override/dir',
      foo: 'bar'
    })
  })
})
