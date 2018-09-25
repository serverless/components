import isVariable from './isVariable'

describe('#isVariable()', () => {
  it('should match variable with only one word', () => {
    expect(isVariable('${abc}')).toBe(true)
  })

  it('should match variable with word with underscores', () => {
    expect(isVariable('${abc_Def0}')).toBe(true)
  })

  it('should match variable with two words separated by dots', () => {
    expect(isVariable('${abc.def}')).toBe(true)
  })

  it('should match variable with array based matches', () => {
    expect(isVariable('${abc[1]}')).toBe(true)
  })

  it('should match variable with surounding text', () => {
    expect(isVariable('hello ${abc} dude')).toBe(true)
  })

  it('should ignore bad syntax', () => {
    expect(isVariable('${abc.def')).toBe(false)
  })
})
