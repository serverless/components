const extractName = require('./extractName')

describe('#extractName()', () => {
  it('should extract the name', () => {
    const fullName = '1/2/3/4/5/the-name'
    const res = extractName(fullName)

    expect(res).toEqual('the-name')
  })
})
