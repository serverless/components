const protocol = require('./application')

describe('lambda protocol tests', () => {
  it('should return correct types', () => {
    expect(protocol.types).toEqual(['application'])
  })
})
