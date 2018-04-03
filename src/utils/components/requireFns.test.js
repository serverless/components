const requireFns = require('./requireFns')

describe('#requireFns()', () => {
  it('should silently fail if component entry point could not be loaded', () => {
    const componentRoot = './registry/some-component'
    expect(() => requireFns(componentRoot)).not.toThrowError()
  })

  it('should throw a custom error message if a component dependency is not installed', () => {
    const componentRoot = 'some-dependency'
    expect(() => requireFns(componentRoot)).toThrowError(/Have you installed/)
  })
})
