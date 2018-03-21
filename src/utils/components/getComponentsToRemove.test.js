const getComponentsToRemove = require('./getComponentsToRemove')

describe('#getComponentsToRemove()', () => {
  const stateFile = {
    'function-mock': {
      type: 'tests-integration-function-mock',
      state: {
        memorySize: 512,
        timeout: 60
      }
    },
    'iam-mock': {
      type: 'tests-integration-function-mock',
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
        type: 'tests-integration-function-mock',
        inputs: {},
        outputs: {},
        state: { memorySize: 512, timeout: 60 },
        dependencies: [],
        fns: {
          deploy: expect.any(Function),
          remove: expect.any(Function),
          invoke: expect.any(Function)
        }
      }
    }
    const res = await getComponentsToRemove(stateFile, loadedComponents)

    expect(res).toEqual(expected)
  })
})
