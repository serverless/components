const setInputDefaults = require('./setInputDefaults')

describe('#setInputDefaults()', () => {
  it('should return updated inputs', () => {
    const inputTypes = {
      name: {
        type: 'string',
        default: 'Jon Doe'
      }
    }
    const inputs = {
      name: 'Server Less'
    }
    const expected = {
      name: 'Server Less'
    }

    const res = setInputDefaults(inputTypes, inputs)
    expect(res).toEqual(expected)
  })

  it('should return updated inputs with default values set if the specific input is not present', () => {
    const inputTypes = {
      name: {
        type: 'string',
        default: 'John Doe'
      }
    }
    const inputs = {}
    const expected = {
      name: 'John Doe'
    }

    const res = setInputDefaults(inputTypes, inputs)
    expect(res).toEqual(expected)
  })

  it('should return updated inputs with default values set if the specific input is empty', () => {
    const inputTypes = {
      name: {
        type: 'string',
        default: 'John Doe'
      }
    }
    const inputs = {
      name: ''
    }
    const expected = {
      name: 'John Doe'
    }

    const res = setInputDefaults(inputTypes, inputs)
    expect(res).toEqual(expected)
  })

  it('should support the setting of multiple defaults', () => {
    const inputTypes = {
      firstName: {
        type: 'string',
        default: 'John'
      },
      lastName: {
        type: 'string',
        default: 'Doe'
      }
    }
    const inputs = {}
    const expected = {
      firstName: 'John',
      lastName: 'Doe'
    }
    const res = setInputDefaults(inputTypes, inputs)
    expect(res).toEqual(expected)
  })

  describe('when dealing with different default formats', () => {
    it('should support defaults which are strings', () => {
      const inputTypes = {
        name: {
          type: 'string',
          default: 'John Doe'
        }
      }
      const inputs = {}
      const expected = {
        name: 'John Doe'
      }
      const res = setInputDefaults(inputTypes, inputs)
      expect(res).toEqual(expected)
    })

    it('should support defaults which are numbers', () => {
      const inputTypes = {
        age: {
          type: 'number',
          default: 47
        }
      }
      const inputs = {}
      const expected = {
        age: 47
      }
      const res = setInputDefaults(inputTypes, inputs)
      expect(res).toEqual(expected)
    })

    it('should support defaults which are arrays', () => {
      const inputTypes = {
        languages: {
          type: 'array',
          default: ['german', 'english']
        }
      }
      const inputs = {}
      const expected = {
        languages: ['german', 'english']
      }
      const res = setInputDefaults(inputTypes, inputs)
      expect(res).toEqual(expected)
    })

    it('should support defaults which are objects', () => {
      const inputTypes = {
        props: {
          type: 'object',
          default: {
            size: 12,
            gender: 'male',
            languages: ['german', 'english'],
            family: {
              brother: 'Luke',
              sister: 'Lana'
            }
          }
        }
      }
      const inputs = {}
      const expected = {
        props: {
          size: 12,
          gender: 'male',
          languages: ['german', 'english'],
          family: {
            brother: 'Luke',
            sister: 'Lana'
          }
        }
      }
      const res = setInputDefaults(inputTypes, inputs)
      expect(res).toEqual(expected)
    })
  })
})
