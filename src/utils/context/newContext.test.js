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
      console: {
        log: expect.any(Function),
        debug: expect.any(Function),
        info: expect.any(Function),
        warn: expect.any(Function),
        error: expect.any(Function)
      },
      construct: expect.any(Function),
      create: expect.any(Function),
      createDeployment: expect.any(Function),
      createInstance: expect.any(Function),
      createRemovalDeployment: expect.any(Function),
      cwd: '/test/dir',
      data: {},
      debug: expect.any(Function),
      defineComponent: expect.any(Function),
      defineComponentFromState: expect.any(Function),
      define: expect.any(Function),
      deployment: {},
      generateInstanceId: expect.any(Function),
      get: expect.any(Function),
      getState: expect.any(Function),
      loadApp: expect.any(Function),
      loadDeployment: expect.any(Function),
      loadInstance: expect.any(Function),
      loadPlugins: expect.any(Function),
      loadPreviousDeployment: expect.any(Function),
      loadPreviousInstance: expect.any(Function),
      loadProject: expect.any(Function),
      loadState: expect.any(Function),
      import: expect.any(Function),
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
