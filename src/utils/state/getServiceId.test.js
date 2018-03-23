const { assoc } = require('ramda')
const getServiceId = require('./getServiceId')

describe('#getServiceId()', () => {
  const stateFileContent = {
    'myApp:myFunction': {
      type: 'aws-iam-function',
      internallyManaged: false,
      state: {
        name: 'my-function',
        memorySize: 512,
        timeout: 60
      }
    }
  }

  it('should return the serviceId', () => {
    const serviceId = 'AsH3gefdfDSY'
    const modifiedStateFileContent = assoc('serviceId', serviceId, stateFileContent)

    const res = getServiceId(modifiedStateFileContent)
    expect(res).toEqual(serviceId)
  })

  it('should return undefined if no serviceId is defined', () => {
    const res = getServiceId(stateFileContent)
    expect(res).toBeUndefined()
  })
})
