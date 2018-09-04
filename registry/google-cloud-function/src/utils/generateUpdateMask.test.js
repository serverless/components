const generateUpdateMask = require('./generateUpdateMask')

describe('#generateUpdateMask()', () => {
  it('should generate a valid updateMask', () => {
    const keys = ['entryPoint', 'eventTrigger']
    const res = generateUpdateMask(keys)

    expect(res).toEqual('entryPoint,eventTrigger')
  })

  it('should only include valid keys', () => {
    const keys = ['labels', 'name', 'INVALID']
    const res = generateUpdateMask(keys)

    expect(res).toEqual('labels,name')
  })

  it('should return an empty string if no keys match the valid keys', () => {
    const keys = ['INVALID']
    const res = generateUpdateMask(keys)

    expect(res).toEqual('')
  })

  it('should return an empty string if no keys are provided', () => {
    const res = generateUpdateMask()

    expect(res).toEqual('')
  })
})
