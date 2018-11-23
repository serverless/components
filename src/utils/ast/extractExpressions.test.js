import extractExpressions from './extractExpressions'

describe('#extractExpressions()', () => {
  it('should extract expressions from code statements', () => {
    expect(extractExpressions('this.foo || this.foo.bar || true')).toEqual(
      expect.arrayContaining(['this.foo', 'this.foo.bar'])
    )
    expect(extractExpressions('this.foo')).toEqual(expect.arrayContaining(['this.foo']))
    expect(extractExpressions('true')).toEqual(expect.arrayContaining([]))
  })
})
