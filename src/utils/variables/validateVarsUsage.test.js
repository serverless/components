const validateVarsUsage = require('./validateVarsUsage')

describe('#validateVarsUsage()', () => {
  it('should return true if variables are used correctly', () => {
    const serverlessYml = {
      type: 'my-component',
      version: '0.1.0'
    }

    const res = validateVarsUsage(serverlessYml)
    expect(res).toEqual(true)
  })

  it('should skip validation if a property is not present', () => {
    const serverlessYml = {
      type: 'my-component'
    }

    const res = validateVarsUsage(serverlessYml)
    expect(res).toEqual(true)
  })

  describe('when violating variable usage', () => {
    it('should throw if variables are used in the "type" property', () => {
      const serverlessYml = {
        type: '${self.foo}', // eslint-disable-line no-template-curly-in-string
        version: '0.1.0'
      }

      expect(() => validateVarsUsage(serverlessYml)).toThrow(/cannot be used in "type"/)
    })

    it('should throw if variables are used in the "version" property', () => {
      const serverlessYml = {
        type: 'my-component',
        version: '${self.foo}' // eslint-disable-line no-template-curly-in-string
      }

      expect(() => validateVarsUsage(serverlessYml)).toThrow(/or "version"/)
    })
  })
})
