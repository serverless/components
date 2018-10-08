import { SYMBOL_VARIABLE } from '../constants'
import isVariable from './isVariable'

describe('#isVariable()', () => {
  it('should return true for object with variable symbol', () => {
    expect(isVariable({ [SYMBOL_VARIABLE]: true })).toBe(true)
  })

  it('should return false for object where variable symbol is false', () => {
    expect(isVariable({ [SYMBOL_VARIABLE]: false })).toBe(false)
  })

  test('returns false for all other values', () => {
    expect(isVariable(undefined)).toBe(false)
    expect(isVariable(null)).toBe(false)
    expect(isVariable('')).toBe(false)
    expect(isVariable('abc')).toBe(false)
    expect(isVariable(false)).toBe(false)
    expect(isVariable(true)).toBe(false)
    expect(isVariable(0)).toBe(false)
    expect(isVariable(-1)).toBe(false)
    expect(isVariable(1)).toBe(false)
    expect(isVariable(NaN)).toBe(false)
    expect(isVariable(Infinity)).toBe(false)
    expect(isVariable(-Infinity)).toBe(false)
    expect(isVariable([])).toBe(false)
    expect(isVariable({})).toBe(false)
    expect(isVariable(() => {})).toBe(false)
  })
})
