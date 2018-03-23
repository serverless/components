const setServiceId = require('./setServiceId')

describe('#setServiceId()', () => {
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

  it('should set the serviceId property on the global state object', () => {
    const res = setServiceId(stateFileContent)
    expect(res).toHaveProperty('$.serviceId')
    expect(res.$.serviceId.length).not.toEqual(0)
  })
})
