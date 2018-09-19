import { createContext } from '../../src/utils'

describe('Integration Test - load types', () => {
  it('should load a working type using a file path', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const type = await context.loadType('./load-types/Foo')
    expect(type).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: {
        foofn: expect.any(Function)
      },
      parent: {
        class: expect.any(Function),
        constructor: expect.any(Function),
        main: {
          construct: expect.any(Function)
        },
        parent: undefined,
        props: {
          main: './index.js',
          name: 'Object',
          version: '1.0.0'
        },
        root: expect.stringMatching(/^.*Object$/)
      },
      props: {
        main: './index.js',
        name: 'Foo',
        type: 'Object',
        foo: 'abc',
        baz: 'abc'
      },
      root: expect.stringMatching(/^.*Foo$/)
    })

    const inputs = {}
    const instance = context.construct(type, inputs)
    expect(instance).toEqual({
      baz: 'abc',
      foo: 'abc',
      main: './index.js',
      name: 'Foo',
      type: 'Object',
      version: '1.0.0'
    })
    expect(instance).toBeInstanceOf(type.class)
    expect(instance).toBeInstanceOf(type.parent.class)
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
    const type = await context.loadType('./load-types/Bar', context)
    expect(type).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: {
        barfn: expect.any(Function)
      },
      parent: {
        class: expect.any(Function),
        constructor: expect.any(Function),
        main: {
          foofn: expect.any(Function)
        },
        parent: {
          class: expect.any(Function),
          constructor: expect.any(Function),
          main: {
            construct: expect.any(Function)
          },
          parent: undefined,
          props: {
            main: './index.js',
            name: 'Object',
            version: '1.0.0'
          },
          root: expect.stringMatching(/^.*Object$/)
        },
        props: {
          main: './index.js',
          name: 'Foo',
          type: 'Object',
          foo: 'abc',
          baz: 'abc'
        },
        root: expect.stringMatching(/^.*Foo$/)
      },
      props: {
        main: './index.js',
        name: 'Bar',
        type: '../Foo',
        bar: 'def',
        baz: 'def'
      },
      root: expect.stringMatching(/^.*Bar$/)
    })

    const inputs = {}
    const instance = context.construct(type, inputs)
    expect(instance).toEqual({
      bar: 'def',
      baz: 'def',
      foo: 'abc',
      main: './index.js',
      name: 'Bar',
      type: '../Foo',
      version: '1.0.0'
    })
    expect(instance).toBeInstanceOf(type.class)
    expect(instance).toBeInstanceOf(type.parent.class)
    expect(instance.foofn()).toBe(instance)
  })
})
