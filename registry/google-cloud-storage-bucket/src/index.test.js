const component = require('./index')

const mockBucketMetadata = (name) => {
  return {
    kind: 'storage#bucket',
    id: name,
    selfLink: 'https://www.googleapis.com/storage/v1/b/' + name,
    projectNumber: '601892377150',
    name: name,
    timeCreated: '2018-10-03T23:09:00.504Z',
    updated: '2018-10-03T23:09:00.504Z',
    metageneration: '1',
    location: 'US',
    storageClass: 'STANDARD',
    etag: 'CAE='
  }
}

const mocks = {
  createBucket: jest
    .fn()
    .mockImplementation((name) => Promise.resolve([{ metadata: mockBucketMetadata(name) }])),
  deleteBucket: jest.fn().mockResolvedValue(null),
  // @todo use the name passed to the bucket constructor mock.
  getBucket: jest.fn().mockResolvedValue([mockBucketMetadata('some-bucket-name')])
}

jest.mock('@google-cloud/storage', () => {
  return {
    Storage: jest.fn().mockImplementation(() => {
      return {
        createBucket: mocks.createBucket,
        // Parameters to the bucket constructor are this, name, options.
        bucket: jest.fn().mockImplementation(() => {
          return {
            delete: mocks.deleteBucket,
            getMetadata: mocks.getBucket
          }
        })
      }
    })
  }
})

// Test lifecycle handlers.
afterAll(() => {
  jest.restoreAllMocks()
})
beforeEach(() => {
  jest.clearAllMocks()
})

describe('#google-cloud-storage-bucket', () => {
  it('should deploy the cloud storage bucket with no errors', async () => {
    const contextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name',
      project: 'some-project-name'
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(mocks.createBucket).toHaveBeenCalledTimes(1)
    expect(outputs.name).toEqual(inputs.name)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove a non-deployed cloud storage bucket with no errors', async () => {
    const contextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name',
      project: 'some-project-name'
    }

    await component.remove(inputs, contextMock)

    expect(mocks.deleteBucket).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should remove a deployed cloud storage bucket with no errors', async () => {
    const contextMock = {
      state: { name: 'some-bucket-name' },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name',
      project: 'some-project-name'
    }

    await component.remove(inputs, contextMock)

    expect(mocks.deleteBucket).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should retrieve metadata about a deployed cloud storage bucket with no errors', async () => {
    const contextMock = {
      state: { name: 'some-bucket-name' },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name',
      project: 'some-project-name'
    }

    await component.info(inputs, contextMock)

    expect(mocks.getBucket).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
    // @todo fix the getMetadata mock to return the mock bucket metadata.
    // Add an assertion to confirm the bucket name makes it's way back.
  })
})
