const protocol = require('./application')

describe('application protocol tests', () => {
  it('should return correct types', () => {
    expect(protocol.types).toEqual(['application'])
  })
})
