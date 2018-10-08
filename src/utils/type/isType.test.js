import { SYMBOL_TYPE } from '../constants'
import isType from './isType'

describe('#isType()', () => {
  test('returns true for a Type object', () => {
    expect(
      isType({
        class: class {},
        constructor: class {},
        main: {},
        props: {},
        root: '/foo'
      })
    ).toBe(true)
  })

  test('returns false for all other values', () => {
    expect(isType(undefined)).toBe(false)
    expect(isType(null)).toBe(false)
    expect(isType('')).toBe(false)
    expect(isType('abc')).toBe(false)
    expect(isType(false)).toBe(false)
    expect(isType(true)).toBe(false)
    expect(isType(0)).toBe(false)
    expect(isType(-1)).toBe(false)
    expect(isType(1)).toBe(false)
    expect(isType(NaN)).toBe(false)
    expect(isType(Infinity)).toBe(false)
    expect(isType(-Infinity)).toBe(false)
    expect(isType([])).toBe(false)
    expect(isType({})).toBe(false)
    expect(isType(() => {})).toBe(false)
  })
})
