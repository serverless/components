const validateInputs = require('./validateInputs')

describe('#validateInputs()', () => {
  const componentId = 'someFunction:someRole'
  const inputTypes = {
    name: {
      type: 'string',
      required: true
    }
  }

  it('should throw if inputs do not match input types', () => {
    const inputs = { name: 1234 }

    expect(() => validateInputs(componentId, inputTypes, inputs)).toThrowError('Type error in component')
  })

  it('should not throw if inputs match input types', () => {
    const inputs = { name: 'some name' }

    expect(() => validateInputs(componentId, inputTypes, inputs)).not.toThrowError()
  })
})
