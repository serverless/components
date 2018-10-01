const convertRuntime = require('./convertRuntime')

describe('#convertRuntime()', () => {
  it('should convert a Node.js runtime to the provider specific runtime', () => {
    const res = convertRuntime('nodejs')
    expect(res).toEqual('nodejs6')
  })

  it('should throw if provided runtime is not supported', () => {
    expect(() => convertRuntime('unsupported')).toThrow('Unknown runtime')
  })
})
