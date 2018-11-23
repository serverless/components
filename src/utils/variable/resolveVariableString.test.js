import resolveVariableString from './resolveVariableString'

describe('#resolveVariableString()', () => {
  it('should resolve exact matches to actual value', () => {
    expect(resolveVariableString('${abc}', { abc: undefined })).toBe(undefined)
    expect(resolveVariableString('${abc}', { abc: null })).toBe(null)
    expect(resolveVariableString('${abc}', { abc: '' })).toBe('')
    expect(resolveVariableString('${abc}', { abc: 'abc' })).toBe('abc')
    expect(resolveVariableString('${abc}', { abc: false })).toBe(false)
    expect(resolveVariableString('${abc}', { abc: true })).toBe(true)
    expect(resolveVariableString('${abc}', { abc: 0 })).toBe(0)
    expect(resolveVariableString('${abc}', { abc: -1 })).toBe(-1)
    expect(resolveVariableString('${abc}', { abc: 1 })).toBe(1)
    expect(resolveVariableString('${abc}', { abc: NaN })).toBe(NaN)
    expect(resolveVariableString('${abc}', { abc: Infinity })).toBe(Infinity)
    expect(resolveVariableString('${abc}', { abc: -Infinity })).toBe(-Infinity)
    expect(resolveVariableString('${abc}', { abc: [] })).toEqual([])
    expect(resolveVariableString('${abc}', { abc: {} })).toEqual({})
    // TODO BRN: What to do about functions?
  })

  it('should resolve non exact matches to string', () => {
    expect(resolveVariableString('dude, ${abc}', { abc: 'sweet' })).toBe('dude, sweet')
    expect(resolveVariableString('dude, ${abc}', { abc: ['s', 'w', 'e', 'e', 't'] })).toBe(
      'dude, s,w,e,e,t'
    )
    expect(
      resolveVariableString('dude, ${abc}', {
        abc: {
          toString() {
            return 'sweet'
          }
        }
      })
    ).toBe('dude, sweet')
  })

  it('should be able to deal with OR (||) usages', () => {
    expect(resolveVariableString("${abc || 'Hello world'}", { abc: false })).toBe('Hello world')
    expect(resolveVariableString("${abc || 'Hello world'}", { abc: 'Hello world' })).toBe(
      'Hello world'
    )
    expect(resolveVariableString("Hello ${abc || 'world'}", { abc: false })).toBe('Hello world')
    expect(resolveVariableString("Hello ${abc || 'world'}", { abc: undefined })).toBe('Hello world')
    expect(resolveVariableString("Hello ${abc || 'world'}", { abc: null })).toBe('Hello world')
    expect(resolveVariableString("Hello ${abc || 'world'}", { abc: 'false' })).toBe('Hello false')
    expect(resolveVariableString("Hello ${abc || 'world'}", { abc: 'undefined' })).toBe(
      'Hello undefined'
    )
    expect(resolveVariableString("Hello ${abc || 'world'}", { abc: 'null' })).toBe('Hello null')
    expect(resolveVariableString('Hello ${abc || def}', { abc: false, def: 'world' })).toBe(
      'Hello world'
    )
    expect(
      resolveVariableString("Hello ${this.greeting || 'Default greeting'}", {
        this: { greeting: 'world' }
      })
    ).toBe('Hello world')
  })

  it('should support multiple OR (||) expressions', () => {
    expect(
      resolveVariableString("Hello ${abc || false || undefined || 'world'}", { abc: null })
    ).toBe('Hello world')
  })
})
