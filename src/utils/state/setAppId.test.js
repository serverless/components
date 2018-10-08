import setAppId from './setAppId'

describe('#setAppId()', () => {
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

  it('should set the appId property on the global state object', () => {
    const res = setAppId(stateFileContent)
    expect(res).toHaveProperty('$.appId')
    expect(res.$.appId.length).not.toEqual(0)
  })
})
