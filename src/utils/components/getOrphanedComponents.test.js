const getOrphanedComponents = require('./getOrphanedComponents')

describe('#getOrphanedComponents()', () => {
  const stateFile = {
    'function-mock': {
      type: 'function-mock',
      state: {
        memorySize: 512,
        timeout: 60
      }
    },
    'iam-mock': {
      type: 'iam-mock',
      state: {
        service: 'some.serverless.service'
      }
    },
    // NOTE: this component should be ignored since it's state it empty
    'empty-state': {
      type: 'empty-state',
      state: {}
    }
  }

  const loadedComponents = {
    'iam-mock': {
      id: 'some-id',
      type: 'iam-mock'
      // ...
    }
  }

  it('should extract and return the orphaned components', async () => {
    const expected = {
      'function-mock': {
        id: 'function-mock',
        type: 'function-mock',
        inputs: {},
        outputs: {},
        state: { memorySize: 512, timeout: 60 },
        dependencies: [],
        fns: {}
      }
    }
    const res = await getOrphanedComponents(stateFile, loadedComponents)

    expect(res).toEqual(expected)
  })
})
