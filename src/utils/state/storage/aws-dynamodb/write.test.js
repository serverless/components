const AWS = require('aws-sdk')
const writeStateFile = require('./write')

jest.mock('../../../../utils/logging')

jest.mock('aws-sdk', () => {
  const mocks = {
    updateMock: jest.fn().mockReturnValue(Promise.resolve({ Item: 'ok' }))
  }

  const DocumentClient = {
    update: (obj) => ({
      promise: () => mocks.updateMock(obj)
    })
  }

  return {
    mocks,
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => DocumentClient)
    }
  }
})

afterEach(() => {
  AWS.mocks.updateMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#readStateFile()', () => {
  const fileContent = {
    $: { appId: 'AsH3gefdfDSY' },
    'myApp:myFunction': {
      type: 'aws-iam-function',
      internallyManaged: false,
      state: {
        name: 'my-function',
        memorySize: 512,
        timeout: 60
      }
    },
    'myApp:myRole': {
      type: 'aws-iam-role',
      internallyManaged: false,
      state: {
        name: 'my-role',
        service: 'some.serverless.service'
      }
    }
  }

  it('should write the projects state file and remove lock', async () => {
    const res = await writeStateFile(
      { state: { table: 'my-table', service: 'my-service' } },
      fileContent
    )
    expect(AWS.mocks.updateMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual({
      Item: 'ok'
    })
  })
})
