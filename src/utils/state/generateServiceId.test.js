const generateServiceId = require('./generateServiceId')

describe('#generateServiceId()', () => {
  it('should generate a unique service id with the length of 12 characters', () => {
    const res = generateServiceId()

    expect(res).toMatch(/.+/)
    expect(res.length).toEqual(12)
  })
})
