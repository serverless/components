const getComponentsToRemove = require('./getComponentsToRemove')
const deferredPromise = require('../deferredPromise')

describe('#getComponentsToRemove()', () => {
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
        // promise: deferredPromise(),
        fns: {}
      }
    }
    const res = await getComponentsToRemove(stateFile, loadedComponents)
    delete res.promise
    expect(res).toEqual(expected)
  })
})
