const validateInputs = require('./validateInputs')

describe('#validateInputs()', () => {
  const componentId = 'someFunction:someRole'
  const inputTypes = {
    name: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string',
      default: 'some default description'
    }
  }

  it('should throw if inputs do not match input types', () => {
    const inputs = {
      name: 1234
    }

    expect(() => validateInputs(componentId, inputTypes, inputs)).toThrowError('Type error in component')
  })

  it('should not throw if inputs match input types', () => {
    const inputs = {
      name: 'some name'
    }

    expect(() => validateInputs(componentId, inputTypes, inputs)).not.toThrowError()
  })

  it('should return updated inputs', () => {
    const inputs = {
      name: 'some name',
      description: 'my description'
    }
    const expected = {
      name: 'some name',
      description: 'my description'
    }

    const res = validateInputs(componentId, inputTypes, inputs)
    expect(res).toEqual(expected)
  })

  it('should return updated inputs with default values set if the specific input is not present', () => {
    const inputs = {
      name: 'some name'
    }
    const expected = {
      name: 'some name',
      description: 'some default description'
    }

    const res = validateInputs(componentId, inputTypes, inputs)
    expect(res).toEqual(expected)
  })

  it('should return updated inputs with default values set if the specific input is empty', () => {
    const inputs = {
      name: 'some name',
      description: ''
    }
    const expected = {
      name: 'some name',
      description: 'some default description'
    }

    const res = validateInputs(componentId, inputTypes, inputs)
    expect(res).toEqual(expected)
  })
})
