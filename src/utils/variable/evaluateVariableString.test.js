import evaluateVariableString from './evaluateVariableString'

describe('#evaluateVariableString()', () => {
  it('should resolve exact matches to actual value', () => {
    expect(evaluateVariableString('${abc}', { abc: undefined })).toBe(undefined)
    expect(evaluateVariableString('${abc}', { abc: null })).toBe(null)
    expect(evaluateVariableString('${abc}', { abc: '' })).toBe('')
    expect(evaluateVariableString('${abc}', { abc: 'abc' })).toBe('abc')
    expect(evaluateVariableString('${abc}', { abc: false })).toBe(false)
    expect(evaluateVariableString('${abc}', { abc: true })).toBe(true)
    expect(evaluateVariableString('${abc}', { abc: 0 })).toBe(0)
    expect(evaluateVariableString('${abc}', { abc: -1 })).toBe(-1)
    expect(evaluateVariableString('${abc}', { abc: 1 })).toBe(1)
    expect(evaluateVariableString('${abc}', { abc: NaN })).toBe(NaN)
    expect(evaluateVariableString('${abc}', { abc: Infinity })).toBe(Infinity)
    expect(evaluateVariableString('${abc}', { abc: -Infinity })).toBe(-Infinity)
    expect(evaluateVariableString('${abc}', { abc: [] })).toEqual([])
    expect(evaluateVariableString('${abc}', { abc: {} })).toEqual({})
    // TODO BRN: What to do about functions?
  })

  it('should resolve non exact matches to string', () => {
    expect(evaluateVariableString('dude, ${abc}', { abc: undefined })).toBe('dude, undefined')
    expect(evaluateVariableString('dude, ${abc}', { abc: null })).toBe('dude, null')
    expect(evaluateVariableString('dude, ${abc}', { abc: '' })).toBe('dude, ')
    expect(evaluateVariableString('dude, ${abc}', { abc: 'abc' })).toBe('dude, abc')
    expect(evaluateVariableString('dude, ${abc}', { abc: false })).toBe('dude, false')
    expect(evaluateVariableString('dude, ${abc}', { abc: true })).toBe('dude, true')
    expect(evaluateVariableString('dude, ${abc}', { abc: 0 })).toBe('dude, 0')
    expect(evaluateVariableString('dude, ${abc}', { abc: -1 })).toBe('dude, -1')
    expect(evaluateVariableString('dude, ${abc}', { abc: 1 })).toBe('dude, 1')
    expect(evaluateVariableString('dude, ${abc}', { abc: NaN })).toBe('dude, NaN')
    expect(evaluateVariableString('dude, ${abc}', { abc: Infinity })).toBe('dude, Infinity')
    expect(evaluateVariableString('dude, ${abc}', { abc: -Infinity })).toBe('dude, -Infinity')
    expect(evaluateVariableString('dude, ${abc}', { abc: 'sweet' })).toBe('dude, sweet')
    expect(evaluateVariableString('dude, ${abc}', { abc: ['s', 'w', 'e', 'e', 't'] })).toBe(
      'dude, s,w,e,e,t'
    )
    expect(
      evaluateVariableString('dude, ${abc}', {
        abc: {
          toString() {
            return 'sweet'
          }
        }
      })
    ).toBe('dude, sweet')
  })

  it('supports nested variables', () => {
    expect(
      evaluateVariableString('${abc${def}}', {
        abcghi: true,
        def: 'ghi'
      })
    ).toBe(true)
  })

  it('should be able to deal with OR (||) usages', () => {
    expect(evaluateVariableString("${abc || 'Hello world'}", { abc: false })).toBe('Hello world')
    expect(evaluateVariableString("${abc || 'Hello world'}", { abc: true })).toBe(true)
    expect(evaluateVariableString('${abc || false}', { abc: null })).toBe(false)
    expect(
      evaluateVariableString("${this.greeting || 'Default greeting'}", {
        this: { greeting: 'Hello world' }
      })
    ).toBe('Hello world')
  })

  it('should be able to deal with OR (||) usages in exact matches', () => {
    expect(evaluateVariableString("${abc || 'Hello world'}", { abc: false })).toBe('Hello world')
    expect(evaluateVariableString("${abc || 'Hello world'}", { abc: true })).toBe(true)
    expect(evaluateVariableString("${abc || 'Hello world'}", { abc: 1 })).toBe(1)
    expect(evaluateVariableString("${abc || 'Hello world'}", { abc: 'abc' })).toBe('abc')
    expect(evaluateVariableString("${abc || 'Hello world'}", { abc: {} })).toEqual({})
    expect(evaluateVariableString("${abc || 'Hello world'}", { abc: [] })).toEqual([])
  })

  it('should be able to deal with OR (||) usages in non-exact matches', () => {
    expect(evaluateVariableString("Hello ${abc || 'world'}", { abc: false })).toBe('Hello world')
    expect(evaluateVariableString("Hello ${abc || 'world'}", { abc: undefined })).toBe(
      'Hello world'
    )
    expect(evaluateVariableString("Hello ${abc || 'world'}", { abc: null })).toBe('Hello world')
    expect(evaluateVariableString("Hello ${abc || 'world'}", { abc: 'false' })).toBe('Hello false')
    expect(evaluateVariableString("Hello ${abc || 'world'}", { abc: 'undefined' })).toBe(
      'Hello undefined'
    )
    expect(evaluateVariableString("Hello ${abc || 'world'}", { abc: 'null' })).toBe('Hello null')
    expect(evaluateVariableString('Hello ${abc || def}', { abc: false, def: 'world' })).toBe(
      'Hello world'
    )
    expect(
      evaluateVariableString("Hello ${this.greeting || 'Default greeting'}", {
        this: { greeting: 'world' }
      })
    ).toBe('Hello world')
  })

  it('should support multiple OR (||) expressions', () => {
    expect(
      evaluateVariableString("Hello ${abc || false || undefined || 'world'}", { abc: null })
    ).toBe('Hello world')
  })
})
