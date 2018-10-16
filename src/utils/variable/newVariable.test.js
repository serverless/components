import newVariable from './newVariable'

describe('#newVariable()', () => {
  it('should resolve as string when coherced', () => {
    const variableString = '${foo}'
    const data = {
      foo: 123
    }
    const variable = newVariable(variableString, data)
    expect('abc' + variable).toBe('abc123')
  })
})
