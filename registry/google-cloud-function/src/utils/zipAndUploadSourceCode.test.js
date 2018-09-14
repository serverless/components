const pack = require('./pack')
const getStorageClient = require('./getStorageClient')
const zipAndUploadSourceCode = require('./zipAndUploadSourceCode')

let mockCreateBucket
let mockDelete
let mockMakePublic
let mockUpload

jest.mock('./pack', () => jest.fn())
jest.mock('./getStorageClient', () =>
  jest.fn(() => {
    return {
      createBucket: mockCreateBucket,
      bucket: () => ({
        file: () => ({
          delete: mockDelete,
          makePublic: mockMakePublic
        }),
        upload: mockUpload
      })
    }
  })
)

afterAll(() => {
  jest.restoreAllMocks()
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('#zipAndUploadSourceCode()', () => {
  const projectId = 'project-id-1234'
  const keyFilename = 'key-file-name.json'
  const sourceCodePath = '/source/code-path'
  const deploymentBucket = 'my-bucket'
  const state = {
    sourceArchiveHash: 'old-hash',
    sourceArchiveFilename: 'file-name',
    sourceArchiveUrl: 'gs://my-bucket/file-name'
  }

  it('should zip and upload the source code if the code has changed', async () => {
    mockCreateBucket = jest.fn().mockImplementation(() => Promise.resolve())
    mockDelete = jest.fn().mockImplementation(() => Promise.resolve())
    mockMakePublic = jest.fn().mockImplementation(() => Promise.resolve())
    mockUpload = jest.fn().mockImplementation(() => Promise.resolve())
    pack.mockImplementation(() =>
      Promise.resolve({
        hash: 'new-hash',
        fileName: 'file-name',
        filePath: '/file-path/file-name'
      })
    )

    const res = await zipAndUploadSourceCode(
      projectId,
      keyFilename,
      sourceCodePath,
      deploymentBucket,
      state
    )

    expect(pack).toHaveBeenCalledTimes(1)
    expect(getStorageClient).toHaveBeenCalledTimes(1)
    expect(mockCreateBucket).toBeCalledWith('my-bucket')
    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(mockUpload).toBeCalledWith('/file-path/file-name')
    expect(mockMakePublic).toHaveBeenCalledTimes(1)
    expect(res).toEqual({
      sourceArchiveFilename: 'file-name',
      sourceArchiveUrl: 'gs://my-bucket/file-name',
      sourceArchiveHash: 'new-hash'
    })
  })

  it('should not zip and upload the source code if the code hashes are the same', async () => {
    pack.mockImplementation(() =>
      Promise.resolve({
        hash: 'old-hash'
      })
    )

    const res = await zipAndUploadSourceCode(
      projectId,
      keyFilename,
      sourceCodePath,
      deploymentBucket,
      state
    )

    expect(pack).toHaveBeenCalledTimes(1)
    expect(getStorageClient).toHaveBeenCalledTimes(0)
    expect(res).toEqual({
      sourceArchiveFilename: 'file-name',
      sourceArchiveUrl: 'gs://my-bucket/file-name',
      sourceArchiveHash: 'old-hash'
    })
  })
})
