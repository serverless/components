import createContext from '../../context/createContext'
import getType from './getType'

describe('getType', () => {
  it('returns the correct type for an array', () => {
    expect(getType([])).toBe('array')
    expect(getType(new Array())).toBe('array')
  })

  it('returns the correct type for an object', () => {
    expect(getType({})).toBe('object')
    expect(getType(new Object())).toBe('object')
  })

  it('returns the correct type for a string', () => {
    expect(getType('foo')).toBe('string')
    expect(getType('')).toBe('string')
    expect(getType(new String('foo'))).toBe('string')
    expect(getType(new String())).toBe('string')
  })

  it('returns the correct type for a boolean', () => {
    expect(getType(true)).toBe('boolean')
    expect(getType(false)).toBe('boolean')
    expect(getType(new Boolean(true))).toBe('boolean')
    expect(getType(new Boolean(false))).toBe('boolean')
  })

  it('returns the correct type for null', () => {
    expect(getType(null)).toBe('null')
  })

  it('returns the correct type for undefined', () => {
    expect(getType(undefined)).toBe('undefined')
  })

  it('returns the correct type for NaN', () => {
    expect(getType(NaN)).toBe('nan')
    expect(getType(new Number(NaN))).toBe('nan')
  })

  it('returns the correct type for Infinity', () => {
    expect(getType(Infinity)).toBe('infinity')
    expect(getType(-Infinity)).toBe('infinity')
    expect(getType(new Number(Infinity))).toBe('infinity')
    expect(getType(new Number(-Infinity))).toBe('infinity')
  })

  it('returns the correct type for number', () => {
    expect(getType(123)).toBe('number')
    expect(getType(-123)).toBe('number')
    expect(getType(0)).toBe('number')
    expect(getType(1.23)).toBe('number')
    expect(getType(-1.23)).toBe('number')
    expect(getType(new Number(123))).toBe('number')
    expect(getType(new Number(-123))).toBe('number')
    expect(getType(new Number(0))).toBe('number')
    expect(getType(new Number(1.23))).toBe('number')
    expect(getType(new Number(-1.23))).toBe('number')
  })

  it('returns the correct type for string', () => {
    expect(getType('')).toBe('string')
    expect(getType('abc')).toBe('string')
    expect(getType('123')).toBe('string')
    expect(getType(new String(''))).toBe('string')
    expect(getType(new String('abc'))).toBe('string')
    expect(getType(new String('123'))).toBe('string')
  })

  it('returns component query as type', async () => {
    const context = await createContext({}, { app: { id: 'test' } })
    const Component = await context.import('Component')
    const component = await context.construct(Component, {})
    expect(getType(component)).toBe('Component')
  })

  it('returns null for functions', () => {
    expect(getType(() => {})).toBe(null)
    expect(getType(async () => {})).toBe(null)
    expect(getType(function() {})).toBe(null)
    expect(getType(async function() {})).toBe(null)
    expect(getType(function*() {})).toBe(null)
  })

  it('returns null for custom object instances', () => {
    const Test = function() {}
    expect(getType(new Test())).toBe(null)
  })
})
