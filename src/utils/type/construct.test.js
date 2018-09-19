import construct from './construct'

describe('#construct()', () => {
  it('should construct the constructor', () => {
    const type = {
      constructor: function(inputs, context) {
        this.inputs = inputs
        this.context = context
      }
    }
    const inputs = {}
    const context = {}
    const result = construct(type, inputs, context)
    expect(result).toBeInstanceOf(type.constructor)
    expect(result.inputs).toBe(inputs)
    expect(result.context).toBe(context)
  })
})
