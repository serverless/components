const { assocPath } = require('ramda')
const getInstanceId = require('./getInstanceId')

describe('#getInstanceId()', () => {
  const componentId = 'myApp:myFunction'
  const stateFileContent = {
    [componentId]: {
      type: 'aws-iam-function',
      internallyManaged: false,
      state: {
        name: 'my-function',
        memorySize: 512,
        timeout: 60
      }
    }
  }

  it('should return the instanceId', () => {
    const instanceId = 'cHA9jPi5lPQj'
    const modifiedStateFileContent = assocPath(
      [ 'myApp:myFunction', 'instanceId' ],
      instanceId,
      stateFileContent
    )

    const res = getInstanceId(modifiedStateFileContent, componentId)
    expect(res).toEqual(instanceId)
  })

  it('should generate an instanceId if none is defined', () => {
    const res = getInstanceId(stateFileContent, componentId)
    expect(res.length).not.toEqual(0)
  })
})
