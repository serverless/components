import path from 'path'
import { createContext, SYMBOL_TYPE } from '../../src/utils'

jest.setTimeout(50000)

describe('Integration Test - load types', () => {
  it('should load the Object type by name', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const ObjectType = await context.import('Object')
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
    const ObjectType = await context.import('Object')
    const FooType = await context.import('./load-types/Foo')
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
    expect(instance).toBeInstanceOf(FooType.constructor)
    expect(instance).toBeInstanceOf(FooType.class)
    expect(instance).toBeInstanceOf(ObjectType.constructor)
    expect(instance).toBeInstanceOf(ObjectType.class)
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

  it('should load a type that extends another type by file path', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const ObjectType = await context.import('Object')
    const FooType = await context.import('./load-types/Foo')
    const BarType = await context.import('./load-types/Bar')
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
    expect(instance).toBeInstanceOf(BarType.constructor)
    expect(instance).toBeInstanceOf(BarType.class)
    expect(instance).toBeInstanceOf(FooType.constructor)
    expect(instance).toBeInstanceOf(FooType.class)
    expect(instance).toBeInstanceOf(ObjectType.constructor)
    expect(instance).toBeInstanceOf(ObjectType.class)
    expect(instance.foofn()).toBe(instance)
  })

  it('should load a type that extends another type using class extension', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const ObjectType = await context.import('Object')
    const FooType = await context.import('./load-types/FooClass')
    const BarType = await context.import('./load-types/BarClass')
    expect(BarType).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: expect.any(Function),
      parent: FooType,
      props: {
        main: './index.js',
        name: 'BarClass',
        extends: '../FooClass',
        bar: 'def',
        baz: 'def'
      },
      root: expect.stringMatching(/^.*BarClass$/)
    })

    const inputs = {}
    const instance = await context.construct(BarType, inputs)
    expect(instance).toEqual({
      bar: 'def',
      baz: 'def',
      extends: '../FooClass',
      foo: 'abc',
      main: './index.js',
      name: 'BarClass',
      version: '1.0.0',
      [SYMBOL_TYPE]: BarType
    })
    expect(instance).toBeInstanceOf(BarType.constructor)
    expect(instance).toBeInstanceOf(BarType.class)
    expect(instance).toBeInstanceOf(FooType.constructor)
    expect(instance).toBeInstanceOf(FooType.class)
    expect(instance).toBeInstanceOf(ObjectType.constructor)
    expect(instance).toBeInstanceOf(ObjectType.class)
    expect(instance.foofn()).toBe(instance)
  })

  it('should load AwsLambdaFunction', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const AwsProvider = await context.import('AwsProvider')
    const AwsProviderInputs = {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKIAIJKIIU5OJU37BTCQ',
        secretAccessKey: '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'
      }
    }
    const awsProvider = await context.construct(AwsProvider, AwsProviderInputs, context)

    const AwsLambdaFunction = await context.import('AwsLambdaFunction')
    const AwsLambdaFunctionInputs = {
      provider: awsProvider,
      name: 'type-system-demo-11',
      memory: 512,
      timeout: 10,
      runtime: 'nodejs8.10',
      code: './load-types/SimpleLambda',
      handler: 'index.handler'
    }
    const awsLambdaFunction = await context.construct(
      AwsLambdaFunction,
      AwsLambdaFunctionInputs,
      context
    )

    await awsLambdaFunction.deploy(context)
  })

  it.only('should load Function', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, 'load-types', 'emptyProject')
    })
    context = await context.loadProject()
    context = await context.loadApp()
    const AwsProvider = await context.import('AwsProvider')
    const AwsProviderInputs = {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'xxx',
        secretAccessKey: 'xxx'
      }
    }
    const awsProvider = await context.construct(AwsProvider, AwsProviderInputs, context)

    const AwsLambdaCompute = await context.import('AwsLambdaCompute')
    const AwsLambdaComputeInputs = {
      provider: awsProvider,
      memory: 512,
      runtime: 'nodejs'
    }
    const awsLambdaCompute = await context.construct(
      AwsLambdaCompute,
      AwsLambdaComputeInputs,
      context
    )

    const Function = await context.import('Function')
    const FunctionInputs = {
      compute: {
        aws: awsLambdaCompute
      },
      functionName: 'type-system-demo-11',
      memory: 512,
      timeout: 10,
      runtime: 'nodejs',
      code: './load-types/SimpleFunction',
      handler: 'index.hello'
    }
    const fn = await context.construct(Function, FunctionInputs, context)
    expect(fn).toBeInstanceOf(Function.class)
    expect(fn).toMatchObject({
      instanceId: expect.any(String)
    })
  })
})
