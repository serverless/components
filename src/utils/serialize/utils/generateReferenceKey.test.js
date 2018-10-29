import createContext from './createContext'
import generateReferenceKey from './generateReferenceKey'

describe('generateReferenceKey', () => {
  it('generates the same key for the same instance', () => {
    const context = createContext({})
    const object = {}
    // generates on the first pass
    expect(generateReferenceKey(context, object)).toBe('@@ref-1')
    // returns same value on the second pass
    expect(generateReferenceKey(context, object)).toBe('@@ref-1')
  })

  it('generates the same keys for different calls', () => {
    const context = createContext({})
    const array = []
    const object = {}
    // generates on the first pass
    expect(generateReferenceKey(context, array)).toBe('@@ref-1')
    expect(generateReferenceKey(context, object)).toBe('@@ref-2')

    // returns same value on the second pass
    expect(generateReferenceKey(context, array)).toBe('@@ref-1')
    expect(generateReferenceKey(context, object)).toBe('@@ref-2')
  })
})
