import isEvaluable from './isEvaluable'
import newVariable from './newVariable'

describe('#isEvaluable()', () => {
  it('should return true for a variable', () => {
    expect(isEvaluable(newVariable('${foo}', { foo: 'bar' }))).toBe(true)
  })

  it('should return true any object with resolve method', () => {
    expect(isEvaluable({ resolve: () => {} })).toBe(true)
  })

  test('returns false for all other values', () => {
    expect(isEvaluable(undefined)).toBe(false)
    expect(isEvaluable(null)).toBe(false)
    expect(isEvaluable('')).toBe(false)
    expect(isEvaluable('abc')).toBe(false)
    expect(isEvaluable(false)).toBe(false)
    expect(isEvaluable(true)).toBe(false)
    expect(isEvaluable(0)).toBe(false)
    expect(isEvaluable(-1)).toBe(false)
    expect(isEvaluable(1)).toBe(false)
    expect(isEvaluable(NaN)).toBe(false)
    expect(isEvaluable(Infinity)).toBe(false)
    expect(isEvaluable(-Infinity)).toBe(false)
    expect(isEvaluable([])).toBe(false)
    expect(isEvaluable({})).toBe(false)
    expect(isEvaluable(() => {})).toBe(false)
  })
})
