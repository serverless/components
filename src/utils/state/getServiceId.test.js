const { assocPath } = require('ramda')
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
    const serviceId = 'pah732o2gj'
    const modifiedStateFileContent = assocPath(['$', 'serviceId'], serviceId, stateFileContent)

    const res = getServiceId(modifiedStateFileContent)
    expect(res).toEqual(serviceId)
  })

  it('should generate a serviceId if none is defined', () => {
    const res = getServiceId(stateFileContent)
    expect(res.length).not.toEqual(0)
  })
})
