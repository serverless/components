const { getTmpDir } = require('@serverless/utils')
const { join } = require('path')
const getComponentsFromStateFile = require('./getComponentsFromStateFile')

describe('#getComponentsFromStateFile()', () => {
  let oldCwd
  let tmpDirPath
  let stateFile

  beforeEach(async () => {
    oldCwd = process.cwd()
    process.chdir(await getTmpDir())
    tmpDirPath = process.cwd()
    stateFile = {
      $: {
        serviceId: 'dmoh0ix898'
      },
      'empty-state': {
        type: 'empty-state',
        inputs: {},
        state: {}
      },
      'internally-managed': {
        type: 'internally-managed',
        internallyManaged: true,
        inputs: {
          name: 'inputs-internally-managed'
        },
        state: {
          state: 'state-internally-managed'
        },
        rootPath: join(
          tmpDirPath,
          'registry-path',
          'mocks',
          'internally-managed'
        )
      },
      // NOTE: only the following state-objects should be used
      'function-mock': {
        type: 'function-mock',
        inputs: {
          name: 'inputs-function-mock-name'
        },
        state: {
          name: 'state-function-mock-name'
        },
        rootPath: join(tmpDirPath, 'registry-path', 'mocks', 'function-mock')
      },
      'iam-mock': {
        type: 'iam-mock',
        inputs: {
          name: 'inputs-iam-mock-name',
          service: 'inputs.some.serverless.service'
        },
        state: {
          name: 'state-iam-mock-name',
          service: 'state.some.serverless.service'
        },
        rootPath: join(tmpDirPath, 'registry-path', 'mocks', 'iam-mock')
      }
    }
  })

  afterEach(() => {
    process.chdir(oldCwd)
  })

  it('should extract and return the components from the state file', async () => {
    const res = getComponentsFromStateFile(stateFile)
    expect(Object.keys(res).length).toEqual(2)
    expect(res).toHaveProperty('function-mock')
    expect(res).toHaveProperty('iam-mock')
    const functionMock = res['function-mock']
    const iamMock = res['iam-mock']
    expect(Object.keys(functionMock).length).toEqual(10)
    expect(Object.keys(iamMock).length).toEqual(10)
    expect(functionMock).toHaveProperty('id', 'function-mock')
    expect(functionMock).toHaveProperty('type', 'function-mock')
    expect(functionMock).toHaveProperty('inputs', {
      name: 'inputs-function-mock-name'
    })
    expect(functionMock).toHaveProperty('outputs', {})
    expect(functionMock).toHaveProperty(
      'rootPath',
      join(tmpDirPath, 'registry-path', 'mocks', 'function-mock')
    )
    expect(functionMock).toHaveProperty('state', {
      name: 'state-function-mock-name'
    })
    expect(functionMock).toHaveProperty('children', {})
    expect(functionMock).toHaveProperty('dependencies', [])
    expect(functionMock).toHaveProperty('promise')
    expect(functionMock).toHaveProperty('fns', {})
    expect(iamMock).toHaveProperty('id', 'iam-mock')
    expect(iamMock).toHaveProperty('type', 'iam-mock')
    expect(iamMock).toHaveProperty('inputs', {
      name: 'inputs-iam-mock-name',
      service: 'inputs.some.serverless.service'
    })
    expect(iamMock).toHaveProperty('outputs', {})
    expect(iamMock).toHaveProperty(
      'rootPath',
      join(tmpDirPath, 'registry-path', 'mocks', 'iam-mock')
    )
    expect(iamMock).toHaveProperty('state', {
      name: 'state-iam-mock-name',
      service: 'state.some.serverless.service'
    })
    expect(iamMock).toHaveProperty('children', {})
    expect(iamMock).toHaveProperty('dependencies', [])
    expect(iamMock).toHaveProperty('promise')
    expect(iamMock).toHaveProperty('fns', {})
  })
})
