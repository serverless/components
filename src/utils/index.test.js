describe('index', () => {
  test('require runs without error', () => {
    expect(() => {
      require('./')
    }).not.toThrow()
  })

  test('has cli methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      createCli: expect.any(Function)
    })
  })

  test('has component methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      defineComponent: expect.any(Function),
      defineComponentFromState: expect.any(Function),
      getChildrenIds: expect.any(Function),
      getKey: expect.any(Function),
      getParentIds: expect.any(Function),
      setKey: expect.any(Function),
      walkReduceComponent: expect.any(Function)
    })
  })

  test('has constants values', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      DEFAULT_PLUGINS: expect.any(Object),
      PLUGINS_DIR: expect.any(String),
      SYMBOL_KEY: expect.any(Symbol),
      SYMBOL_TYPE: expect.any(Symbol),
      SYMBOL_VARIABLE: expect.any(Symbol),
      TYPE_FILE_NAMES: expect.any(Array)
    })
  })

  test('has context methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      createContext: expect.any(Function),
      newContext: expect.any(Function)
    })
  })

  test('has deployment methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      createDeployment: expect.any(Function),
      loadDeployment: expect.any(Function),
      newDeployment: expect.any(Function)
    })
  })

  test('has logging methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      log: expect.any(Function)
    })
  })

  test('has misc methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      handleSignalEvents: expect.any(Function)
    })
  })

  test('has plugin methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      findPluginForCommand: expect.any(Function),
      loadPlugin: expect.any(Function),
      loadPlugins: expect.any(Function)
    })
  })

  test('has registry methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      getRegistryBucketRoot: expect.any(Function),
      isSemver: expect.any(Function),
      isSemverRange: expect.any(Function)
    })
  })

  test('has type methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      anyTypeFileExistsAtPath: expect.any(Function),
      construct: expect.any(Function),
      defType: expect.any(Function),
      isType: expect.any(Function),
      isTypeName: expect.any(Function),
      loadType: expect.any(Function),
      loadTypes: expect.any(Function)
    })
  })

  test('has variable methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      hasVariableString: expect.any(Function),
      isVariable: expect.any(Function),
      matchVariable: expect.any(Function),
      newVariable: expect.any(Function),
      regexVariable: expect.any(Object),
      resolveVariable: expect.any(Function),
      resolveVariables: expect.any(Function)
    })
  })
})
