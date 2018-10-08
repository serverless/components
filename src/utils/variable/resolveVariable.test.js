import resolveVariable from './resolveVariable'

describe('#resolveVariable()', () => {
  it('should resolve exact matches to actual value', () => {
    expect(resolveVariable('${abc}', { abc: undefined })).toBe(undefined)
    expect(resolveVariable('${abc}', { abc: null })).toBe(null)
    expect(resolveVariable('${abc}', { abc: '' })).toBe('')
    expect(resolveVariable('${abc}', { abc: 'abc' })).toBe('abc')
    expect(resolveVariable('${abc}', { abc: false })).toBe(false)
    expect(resolveVariable('${abc}', { abc: true })).toBe(true)
    expect(resolveVariable('${abc}', { abc: 0 })).toBe(0)
    expect(resolveVariable('${abc}', { abc: -1 })).toBe(-1)
    expect(resolveVariable('${abc}', { abc: 1 })).toBe(1)
    expect(resolveVariable('${abc}', { abc: NaN })).toBe(NaN)
    expect(resolveVariable('${abc}', { abc: Infinity })).toBe(Infinity)
    expect(resolveVariable('${abc}', { abc: -Infinity })).toBe(-Infinity)
    expect(resolveVariable('${abc}', { abc: [] })).toEqual([])
    expect(resolveVariable('${abc}', { abc: {} })).toEqual({})
    // TODO BRN: What to do about functions?
  })

  it('should resolve non exact matches to string', () => {
    expect(resolveVariable('dude, ${abc}'), { abc: 'sweet' }).toBe('dude, sweet')
    expect(resolveVariable('dude, ${abc}'), { abc: ['s', 'w', 'e', 'e', 't'] }).toBe(
      'dude, s,w,e,e,t'
    )
    expect(resolveVariable('dude, ${abc}'), {
      abc: {
        toString() {
          return 'sweet'
        }
      }
    }).toBe('dude, sweet')
  })
})
