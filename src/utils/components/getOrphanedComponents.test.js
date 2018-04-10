const getOrphanedComponents = require('./getOrphanedComponents')

describe('#getOrphanedComponents()', () => {
  const serverlessFileComponents = {
    'iam-mock': {
      id: 'iam-mock-id',
      type: 'iam-mock'
      // ...
    }
  }

  const stateFileComponents = {
    'function-mock': {
      id: 'function-mock-id',
      type: 'function-mock'
      // ...
    },
    'iam-mock': {
      id: 'iam-mock-id',
      type: 'iam-mock'
      // ...
    }
  }

  it('should extract and return the orphaned components', () => {
    const expected = {
      'function-mock': {
        id: 'function-mock-id',
        type: 'function-mock'
      }
    }
    const res = getOrphanedComponents(serverlessFileComponents, stateFileComponents)
    expect(res).toEqual(expected)
  })
})
