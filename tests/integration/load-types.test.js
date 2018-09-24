import { createContext, SYMBOL_TYPE } from '../../src/utils'

describe('Integration Test - load types', () => {
  it('should load the Object type by name', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const ObjectType = await context.loadType('Object')
    expect(ObjectType).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: {
        construct: expect.any(Function),
        getType: expect.any(Function)
      },
      parent: undefined,
      props: {
        main: './index.js',
        name: 'Object',
        version: '1.0.0'
      },
      root: expect.stringMatching(/^.*Object$/)
    })
  })

  it('should load a working type using a file path', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const ObjectType = await context.loadType('Object')
    const FooType = await context.loadType('./load-types/Foo')
    expect(FooType).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: {
        foofn: expect.any(Function)
      },
      parent: ObjectType,
      props: {
        main: './index.js',
        name: 'Foo',
        extends: 'Object',
        foo: 'abc',
        baz: 'abc'
      },
      root: expect.stringMatching(/^.*Foo$/)
    })

    const inputs = {}
    const instance = await context.construct(FooType, inputs)
    expect(instance).toEqual({
      baz: 'abc',
      extends: 'Object',
      foo: 'abc',
      main: './index.js',
      name: 'Foo',
      version: '1.0.0',
      [SYMBOL_TYPE]: FooType
    })
    expect(instance).toBeInstanceOf(FooType.class)
    expect(instance).toBeInstanceOf(FooType.parent.class)
    expect(instance.foofn()).toBe(instance)
  })
  //
  // it('should load a type using a url', async () => {
  //   const context = await createContext({
  //     cwd: __dirname
  //   })
  //   const type = await loadType(
  //     'https://github.com/serverless/components-type-integration-test/archive/master.zip',
  //     context
  //   )
  //   expect(type.props).toEqual({ main: './index.js', name: 'Foo', type: 'Object' })
  // })
  //
  // it('should load a type using a git url', async () => {
  //   const context = await createContext({
  //     cwd: __dirname
  //   })
  //   const type = await loadType(
  //     'https://github.com/serverless/components-type-integration-test.git',
  //     context
  //   )
  //
  //   expect(type.props).toEqual({ main: './index.js', name: 'Foo', type: 'Object' })
  // })
  //
  // it('should load a type using a registry regex', async () => {
  //   const context = await createContext({
  //     cwd: __dirname
  //   })
  //   const type = await loadType('foo@0.1.0', context)
  //   expect(type.props).toEqual({ main: './index.js', name: 'Foo', type: 'Object' })
  // })

  it('should load a type that depends on another type by file path', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const FooType = await context.loadType('./load-types/Foo')
    const BarType = await context.loadType('./load-types/Bar')
    expect(BarType).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: {
        barfn: expect.any(Function)
      },
      parent: FooType,
      props: {
        main: './index.js',
        name: 'Bar',
        extends: '../Foo',
        bar: 'def',
        baz: 'def'
      },
      root: expect.stringMatching(/^.*Bar$/)
    })

    const inputs = {}
    const instance = await context.construct(BarType, inputs)
    expect(instance).toEqual({
      bar: 'def',
      baz: 'def',
      extends: '../Foo',
      foo: 'abc',
      main: './index.js',
      name: 'Bar',
      version: '1.0.0',
      [SYMBOL_TYPE]: BarType
    })
    expect(instance).toBeInstanceOf(BarType.class)
    expect(instance).toBeInstanceOf(BarType.parent.class)
    expect(instance.foofn()).toBe(instance)
  })
})
