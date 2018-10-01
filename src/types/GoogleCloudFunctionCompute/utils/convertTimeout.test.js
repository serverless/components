const convertTimeout = require('./convertTimeout')

describe('#convertTimeout()', () => {
  it('should convert the timeout to a provider supported value', () => {
    const res = convertTimeout(60)
    expect(res).toEqual('60s')
  })

  it('should throw if the provided timeout is a string', () => {
    expect(() => convertTimeout('sixty')).toThrow('not an integer')
  })
})
