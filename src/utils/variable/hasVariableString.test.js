import hasVariableString from './hasVariableString'

describe('#hasVariableString()', () => {
  it('should match variable with only one word', () => {
    expect(hasVariableString('${abc}')).toBe(true)
  })

  it('should match variable with word with underscores', () => {
    expect(hasVariableString('${abc_Def0}')).toBe(true)
  })

  it('should match variable with two words separated by dots', () => {
    expect(hasVariableString('${abc.def}')).toBe(true)
  })

  it('should match variable with array based matches', () => {
    expect(hasVariableString('${abc[1]}')).toBe(true)
  })

  it('should match variable with surounding text', () => {
    expect(hasVariableString('hello ${abc} dude')).toBe(true)
  })

  it('should ignore bad syntax', () => {
    expect(hasVariableString('${abc.def')).toBe(false)
  })

  it('should support OR (||) syntax', () => {
    expect(hasVariableString("${abc || 'hello'}")).toBe(true)
  })

  it('should support multiple OR (||) syntax', () => {
    expect(hasVariableString("${abc || undefined || 'hello'}")).toBe(true)
  })
})
