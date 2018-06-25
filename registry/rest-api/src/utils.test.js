const { joinUrl } = require('./utils')

describe('Component rest-api - Utils', () => {
  const baseUrl = 'http://example.com'

  it('should be able to join arbitrary url parts', () => {
    const part1 = 'foo/'
    const part2 = '/bar'
    const part3 = 'baz'

    const res = joinUrl(baseUrl, [part1, part2, part3])
    expect(res).toEqual('http://example.com/foo/bar/baz')
  })

  it('should be able to join parts with leading slashes', () => {
    const part1 = '/bar'

    const res = joinUrl(baseUrl, [part1])
    expect(res).toEqual('http://example.com/bar')
  })

  it('should be able to join parts with trailing slashes', () => {
    const part1 = 'bar/'

    const res = joinUrl(baseUrl, [part1])
    expect(res).toEqual('http://example.com/bar')
  })
})
