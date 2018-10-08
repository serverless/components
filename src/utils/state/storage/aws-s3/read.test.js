const AWS = require('aws-sdk')
const readStateFile = require('./read')

jest.mock('../../../../utils/logging')

jest.mock('aws-sdk', () => {
  const mocks = {
    headObjectMock: jest.fn().mockImplementation((params) => {
      if (params.Key === 'locked-state.json.lock') {
        return Promise.resolve({ Body: '1533978463592' })
      } else if (params.Key === 'invalid-lock.lock') {
        return Promise.reject({
          statusCode: 500
        })
      }
      return Promise.reject({
        statusCode: 404
      })
    }),
    putObjectMock: jest.fn(),
    getObjectMock: jest.fn().mockImplementation((params) => {
      if (params.Key === 'no-state.json') {
        return Promise.reject({
          statusCode: 404
        })
      } else if (params.Key === 'invalid-state') {
        return Promise.reject({
          statusCode: 500
        })
      }
      return Promise.resolve({
        Body: JSON.stringify({
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
        })
      })
    })
  }

  const S3 = {
    getObject: (obj) => ({
      promise: () => mocks.getObjectMock(obj)
    }),
    headObject: (obj) => ({
      promise: () => mocks.headObjectMock(obj)
    }),
    putObject: (obj) => ({
      promise: () => mocks.putObjectMock(obj)
    })
  }
  return {
    mocks,
    S3: jest.fn().mockImplementation(() => S3)
  }
})

afterEach(() => {
  AWS.mocks.getObjectMock.mockClear()
  AWS.mocks.headObjectMock.mockClear()
  AWS.mocks.putObjectMock.mockClear()
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
    const res = await readStateFile({ state: { bucket: 'my-bucket', file: 'state.json' } })
    expect(AWS.mocks.headObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.putObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.getObjectMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual(fileContent)
  })

  it('should return an empty object if the project does not contain a state file', async () => {
    const res = await readStateFile({ state: { bucket: 'my-bucket', file: 'no-state.json' } })
    expect(AWS.mocks.headObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.putObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.getObjectMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual({})
  })

  it('should throw error if lock file exists', async () => {
    let res
    try {
      res = await readStateFile({ state: { bucket: 'my-bucket', file: 'locked-state.json' } })
    } catch (error) {
      expect(error.message).toContain('State is locked')
    }

    expect(AWS.mocks.headObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.putObjectMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.getObjectMock).toHaveBeenCalledTimes(0)
    expect(res).toBeUndefined()
  })

  it('should throw error on invalid lock call', async () => {
    let res
    try {
      res = await readStateFile({ state: { bucket: 'my-bucket', file: 'invalid-lock' } })
    } catch (error) {
      expect(error.statusCode).toBe(500)
    }

    expect(AWS.mocks.headObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.putObjectMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.getObjectMock).toHaveBeenCalledTimes(0)
    expect(res).toBeUndefined()
  })

  it('should throw error on invalid state call', async () => {
    let res
    try {
      res = await readStateFile({ state: { bucket: 'my-bucket', file: 'invalid-state' } })
    } catch (error) {
      expect(error.statusCode).toBe(500)
    }

    expect(AWS.mocks.headObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.putObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.getObjectMock).toHaveBeenCalledTimes(1)
    expect(res).toBeUndefined()
  })
})
