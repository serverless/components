const haveInputsChanged = require('./haveInputsChanged')

describe('#haveInputsChanged()', () => {
  it('should detect if inputs have changed', () => {
    const componentData = {
      isEqual: false,
      keys: ['prop1', 'prop2']
    }
    const inputFields = ['prop2']
    const res = haveInputsChanged(componentData, inputFields)

    expect(res).toEqual(true)
  })

  it('should return false if no inputs have changed', () => {
    const componentData = {
      isEqual: false,
      keys: ['prop1']
    }
    const inputFields = ['prop2']
    const res = haveInputsChanged(componentData, inputFields)

    expect(res).toEqual(false)
  })
})
