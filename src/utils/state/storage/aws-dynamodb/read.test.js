const AWS = require('aws-sdk')
const readStateFile = require('./read')

jest.mock('../../../../utils/logging')

jest.mock('aws-sdk', () => {
  const mocks = {
    getMock: jest.fn().mockImplementation((params) => {
      if (params.Key.service === 'locked-state') {
        return Promise.resolve({
          Item: {
            lock: true
          }
        })
      } else if (params.Key.service === 'no-state') {
        return Promise.resolve({
          Item: {
            lock: false
          }
        })
      }
      return Promise.resolve({
        Item: {
          lock: false,
          state: {
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
        }
      })
    }),
    updateMock: jest.fn()
  }

  const DocumentClient = {
    get: (obj) => ({
      promise: () => mocks.getMock(obj)
    }),
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
  AWS.mocks.getMock.mockClear()
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

  it('should read the projects state file if present', async () => {
    const res = await readStateFile({ state: { table: 'my-table', service: 'my-service' } })
    expect(AWS.mocks.getMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual(fileContent)
  })

  it('should return an empty object if the project does not contain a state file', async () => {
    const res = await readStateFile({ state: { table: 'my-table', service: 'no-state' } })
    expect(AWS.mocks.getMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual({})
  })

  it('should throw error if lock exists', async () => {
    let res
    try {
      res = await readStateFile({ state: { table: 'my-table', service: 'locked-state' } })
    } catch (error) {
      expect(error.message).toContain('State is locked')
    }

    expect(AWS.mocks.getMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateMock).toHaveBeenCalledTimes(0)
    expect(res).toBeUndefined()
  })
})
