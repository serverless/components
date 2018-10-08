import { assocPath } from '@serverless/utils'
import getAppId from './getAppId'

describe('#getAppId()', () => {
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

  it('should return the appId', () => {
    const appId = 'pah732o2gj'
    const modifiedStateFileContent = assocPath(['$', 'appId'], appId, stateFileContent)

    const res = getAppId(modifiedStateFileContent)
    expect(res).toEqual(appId)
  })

  it('should generate a appId if none is defined', () => {
    const res = getAppId(stateFileContent)
    expect(res.length).not.toEqual(0)
  })
})
