const generateInstanceId = require('./generateInstanceId')

describe('#generateInstanceId()', () => {
  it('should generate a unique instance id with the length of 19 characters', () => {
    const serviceId = '0123456789'
    const res = generateInstanceId(serviceId)

    const splitted = res.split('-')
    const extractedServiceId = res.split('-')[0]

    expect(res).toMatch(/.+-.+/)
    expect(res.length).toEqual(19)
    expect(splitted.length).toEqual(2)
    expect(extractedServiceId).toEqual(serviceId)
  })
})
