const getRandomId = require('./getRandomId')

describe('#getRandomId()', () => {
  it('should generate a unique id with the given length', () => {
    const length = 11

    const res = getRandomId(length)
    expect(res.length).toEqual(length)
    expect(res).toMatch(/.+/)
  })
})
