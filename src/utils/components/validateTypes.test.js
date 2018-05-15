const validateTypes = require('./validateTypes')

describe('#validateTypes()', () => {
  const componentId = 'someFunction:someRole'
  const propTypes = {
    name: {
      type: 'string',
      required: true
    }
  }

  it('should throw if props do not match prop types', () => {
    const props = { name: 1234 }

    expect(() => validateTypes(componentId, propTypes, props)).toThrowError(
      'Type error(s) in component'
    )
  })

  it('should not throw if props match prop types', () => {
    const props = { name: 'some name' }

    expect(() => validateTypes(componentId, propTypes, props)).not.toThrowError()
  })
})
