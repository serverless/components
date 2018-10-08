import getState from './getState'

describe('#getState()', () => {
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
    }
  }

  it('should return the components state if present', () => {
    const expected = {
      memorySize: 512,
      timeout: 60
    }
    const res = getState(stateFile, 'function-mock')
    expect(res).toEqual(expected)
  })

  it('should return an empty object if no state is present', () => {
    const res = getState(stateFile, 'non-present-mock')
    expect(res).toEqual({})
  })
})
