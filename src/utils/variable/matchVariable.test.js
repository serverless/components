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

  it('should match variable with surounding text', () => {
    expect(matchVariable('hello ${abc} dude')).toEqual({
      expression: 'abc',
      exact: false,
      match: '${abc}'
    })
  })
})
