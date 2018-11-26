import isTypeConstruct from './isTypeConstruct'

describe('#isTypeConstruct()', () => {
  const TypeMock = {
    class: class {},
    constructor: class {},
    main: {},
    props: {},
    root: '/foo'
  }

  it('should identify constructs when they have both type and inputs', () => {
    expect(
      isTypeConstruct({
        type: 'Test',
        inputs: {}
      })
    ).toBe(true)
    expect(
      isTypeConstruct({
        type: TypeMock,
        inputs: {}
      })
    ).toBe(true)
    expect(
      isTypeConstruct({
        type: 'Test',
        inputs: null
      })
    ).toBe(false)
    expect(
      isTypeConstruct({
        type: null,
        inputs: {}
      })
    ).toBe(false)
  })

  it('should not identify an object with a type only as a construct', () => {
    // A construct without inputs is not a construct
    expect(
      isTypeConstruct({
        type: 'Test'
      })
    ).toBe(false)

    // A construct without type is not a construct
    expect(
      isTypeConstruct({
        inputs: {}
      })
    ).toBe(false)
  })

  it('should return false for everything else', () => {
    expect(isTypeConstruct({})).toBe(false)
    expect(isTypeConstruct([])).toBe(false)
    expect(isTypeConstruct(null)).toBe(false)
    expect(isTypeConstruct(true)).toBe(false)
  })
})
