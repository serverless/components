import { createContext, loadType } from '../../src/utils'

describe('Integration Test - load types', () => {
  it('should load a type using a file path', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const type = await loadType('./load-types/Foo', context)
    expect(type.props).toEqual({ main: './index.js', name: 'Foo', type: 'Object' })
  })

  it('should load a type using a url', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const type = await loadType(
      'https://github.com/serverless/components-type-integration-test/archive/master.zip',
      context
    )
    expect(type.props).toEqual({ main: './index.js', name: 'Foo', type: 'Object' })
  })

  it('should load a type using a git url', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const type = await loadType(
      'https://github.com/serverless/components-type-integration-test.git',
      context
    )

    expect(type.props).toEqual({ main: './index.js', name: 'Foo', type: 'Object' })
  })

  it('should load a type using a registry regex', async () => {
    const context = await createContext({
      cwd: __dirname
    })
    const type = await loadType('foo@0.1.0', context)
    expect(type.props).toEqual({ main: './index.js', name: 'Foo', type: 'Object' })
  })
})
