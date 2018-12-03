import matchVariable from './matchVariable'

describe('#matchVariable()', () => {
  it('should exact match variable with only one word', () => {
    expect(matchVariable('${abc}')).toEqual({
      expression: 'abc',
      exact: true,
      match: '${abc}'
    })
  })

  it('should return null for non match', () => {
    expect(matchVariable('abc')).toEqual({
      expression: undefined,
      exact: undefined,
      match: undefined
    })
  })

  it('should return expression with incomplete nested braces when missing outer brace', () => {
    expect(matchVariable('${{abc}')).toEqual({
      expression: '{abc',
      exact: true,
      match: '${{abc}'
    })
  })

  it('should match variable with surounding text', () => {
    expect(matchVariable('hello ${abc} dude')).toEqual({
      expression: 'abc',
      exact: false,
      match: '${abc}'
    })
  })

  it('should match OR variables without surrounding text', () => {
    expect(matchVariable("${abc || 'world'}")).toEqual({
      expression: "abc || 'world'",
      exact: true,
      match: "${abc || 'world'}"
    })
  })

  it('should match OR variables with surrounding text', () => {
    expect(matchVariable("hello ${abc || 'world'}")).toEqual({
      expression: "abc || 'world'",
      exact: false,
      match: "${abc || 'world'}"
    })
  })
})
