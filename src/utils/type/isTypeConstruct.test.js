import isTypeConstruct from './isTypeConstruct'

describe('#isTypeConstruct()', () => {
  it('should identify constructs when they have both type and inputs', () => {
    expect(
      isTypeConstruct({
        type: 'Test',
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
    expect(isTypeConstruct({})).toBe(false)
    expect(isTypeConstruct(null)).toBe(false)
  })
})
