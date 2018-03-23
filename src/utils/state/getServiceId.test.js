const getServiceId = require('./getServiceId')

describe('#getServiceId()', () => {
  it('should generate a unique service id with the length of 12 characters', () => {
    const res = getServiceId()

    expect(res).toMatch(/.+/)
    expect(res.length).toEqual(12)
  })
})
