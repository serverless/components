const compareInputsToState = require('./compareInputsToState')

describe('#compareInputsToState()', () => {
  it('should compare the inputs to the state and return a diff', () => {
    const inputs = {
      prop1: 'old-value-1',
      prop2: 'new-value-2'
    }
    const state = {
      prop1: 'old-value-1',
      prop2: 'old-value-2',
      prop3: 'old-value-3'
    }

    const res = compareInputsToState(inputs, state)

    expect(res.hasState).toEqual(true)
    expect(res.isEqual).toEqual(false)
    expect(res.keys).toEqual(['prop2'])
    expect(res.diffs).toEqual({
      prop2: {
        inputs: 'new-value-2',
        state: 'old-value-2'
      }
    })
  })
})
