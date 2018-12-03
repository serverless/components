describe('index', () => {
  test('require runs without error', () => {
    expect(() => {
      require('./')
    }).not.toThrow()
  })

  test('has ast methods', () => {
    const ast = require('./ast')
    expect(ast).toMatchObject({
      extractExpressions: expect.any(Function)
    })
  })

  test('has cli methods', () => {
    const mod = require('./cli')
    expect(mod).toMatchObject({
      createCli: expect.any(Function)
    })
  })

  test('has component methods', () => {
    const mod = require('./component')
    expect(mod).toMatchObject({
      appendKey: expect.any(Function),
      defineComponent: expect.any(Function),
      defineComponentFromState: expect.any(Function),
      getChildrenIds: expect.any(Function),
      getDependenciesIds: expect.any(Function),
      getKey: expect.any(Function),
      getParentId: expect.any(Function),
      getParentIds: expect.any(Function),
      getVariableInstanceIds: expect.any(Function),
      isComponent: expect.any(Function),
      resolveComponentEvaluables: expect.any(Function),
      setKey: expect.any(Function),
      walkReduceComponentChildren: expect.any(Function),
      walkReduceComponentChildrenDepthFirst: expect.any(Function)
    })
  })

  test('has config methods', () => {
    const mod = require('./config')
    expect(mod).toMatchObject({
      createConfig: expect.any(Function),
      getConfig: expect.any(Function),
      getServerlessrcPath: expect.any(Function)
    })
  })

  test('has constants values', () => {
    const mod = require('./constants')
    expect(mod).toMatchObject({
      DEFAULT_PLUGINS: expect.any(Object),
      PLUGINS_DIR: expect.any(String),
      SYMBOL_KEY: expect.any(String),
      SYMBOL_TYPE: expect.anything(),
      SYMBOL_VARIABLE: expect.anything(),
      TYPE_FILE_NAMES: expect.any(Array)
    })
  })

  test('has context methods', () => {
    const mod = require('./context')
    expect(mod).toMatchObject({
      createContext: expect.any(Function),
      newContext: expect.any(Function)
    })
  })

  test('has dag methods', () => {
    const mod = require('./dag')
    expect(mod).toMatchObject({
      buildGraph: expect.any(Function),
      deployGraph: expect.any(Function),
      detectCircularDeps: expect.any(Function),
      removeGraph: expect.any(Function)
    })
  })

  test('has deployment methods', () => {
    const mod = require('./deployment')
    expect(mod).toEqual({
      createDeployment: expect.any(Function),
      createRemovalDeployment: expect.any(Function),
      loadDeployment: expect.any(Function),
      loadPreviousDeployment: expect.any(Function),
      newDeployment: expect.any(Function),
      parseDeploymentNumber: expect.any(Function)
    })
  })

  test('has logging methods', () => {
    const mod = require('./logging')
    expect(mod).toEqual({
      debug: expect.any(Function),
      log: expect.any(Function),
      info: expect.any(Function),
      warn: expect.any(Function),
      error: expect.any(Function)
    })
  })

  test('has misc methods', () => {
    const mod = require('./misc')
    expect(mod).toMatchObject({
      handleSignalEvents: expect.any(Function)
    })
  })

  test('has plugin methods', () => {
    const mod = require('./plugin')
    expect(mod).toMatchObject({
      findPluginForCommand: expect.any(Function),
      loadPlugin: expect.any(Function),
      loadPlugins: expect.any(Function)
    })
  })

  test('has registry methods', () => {
    const mod = require('./registry')
    expect(mod).toMatchObject({
      getRegistryBucketRoot: expect.any(Function),
      isSemver: expect.any(Function),
      isSemverRange: expect.any(Function)
    })
  })

  test('has serialize methods', () => {
    const mod = require('./serialize')
    expect(mod).toMatchObject({
      deserialize: expect.any(Function),
      serialize: expect.any(Function)
    })
  })

  test('has type methods', () => {
    const mod = require('./type')
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
    const mod = require('./variable')
    expect(mod).toMatchObject({
      hasVariableString: expect.any(Function),
      isEvaluable: expect.any(Function),
      isVariable: expect.any(Function),
      matchVariable: expect.any(Function),
      newVariable: expect.any(Function),
      regexVariable: expect.any(Object),
      evaluateVariableString: expect.any(Function)
    })
  })
})
