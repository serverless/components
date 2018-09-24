import construct from './construct'

describe('#construct()', () => {
  it('should construct the constructor', async () => {
    const type = {
      constructor: function(inputs, context) {
        return (async () => {
          this.inputs = inputs
          this.context = context
          return this
        })()
      }
    }
    const inputs = {}
    const context = {}
    const result = await construct(type, inputs, context)
    expect(result).toBeInstanceOf(type.constructor)
    expect(result.inputs).toBe(inputs)
    expect(result.context).toBe(context)
  })
})
