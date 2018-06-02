const protocol = require('./sqs')

describe('sqs protocol tests', () => {
  it('should return correct types', () => {
    expect(protocol.types).toEqual(['sqs'])
  })
})
