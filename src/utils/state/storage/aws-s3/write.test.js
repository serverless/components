const AWS = require('aws-sdk')
const writeStateFile = require('./write')

jest.mock('../../../../utils/logging')

jest.mock('aws-sdk', () => {
  const mocks = {
    deleteObjectMock: jest.fn().mockImplementation((params) => {
      if (params.Key === 'invalid-lock.lock') {
        return Promise.reject({
          statusCode: 500
        })
      } else if (params.Key === 'no-lock.json.lock') {
        return Promise.reject({
          statusCode: 404
        })
      }
      return Promise.resolve()
    }),
    putObjectMock: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ETag: '"6805f2cfc46c0f04559748bb039d69ae"',
        VersionId: 'Kirh.unyZwjQ69YxcQLA8z4F5j3kJJKr'
      })
    })
  }

  const S3 = {
    deleteObject: (obj) => ({
      promise: () => mocks.deleteObjectMock(obj)
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
  AWS.mocks.deleteObjectMock.mockClear()
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

  it('should write the projects state file and remove lock', async () => {
    const res = await writeStateFile(
      { state: { bucket: 'my-bucket', file: 'state.json' } },
      fileContent
    )
    expect(AWS.mocks.deleteObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.putObjectMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual({
      ETag: '"6805f2cfc46c0f04559748bb039d69ae"',
      VersionId: 'Kirh.unyZwjQ69YxcQLA8z4F5j3kJJKr'
    })
  })

  it("should write the projects state file when lock doesn't exists", async () => {
    const res = await writeStateFile(
      { state: { bucket: 'my-bucket', file: 'no-lock.json' } },
      fileContent
    )
    expect(AWS.mocks.deleteObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.putObjectMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual({
      ETag: '"6805f2cfc46c0f04559748bb039d69ae"',
      VersionId: 'Kirh.unyZwjQ69YxcQLA8z4F5j3kJJKr'
    })
  })

  it('should throw error on invalid lock call', async () => {
    let res
    try {
      res = await writeStateFile({ state: { bucket: 'my-bucket', file: 'invalid-lock' } }, {})
    } catch (error) {
      expect(error.statusCode).toBe(500)
    }
    expect(AWS.mocks.deleteObjectMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.putObjectMock).toHaveBeenCalledTimes(0)
    expect(res).toBeUndefined()
  })
})
