const patchFunction = require('./patchFunction')

const mockRequest = jest.fn().mockResolvedValue()

const provider = {
  request: mockRequest
}

afterAll(() => {
  jest.restoreAllMocks()
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('#patchFunction()', () => {
  it('should perform a request to patch (update) the function', async () => {
    const updateMask = [
      'availableMemoryMb',
      'description',
      'entryPoint',
      'environmentVariables',
      'eventTrigger',
      'httpsTrigger',
      'labels',
      'maxInstances',
      'name',
      'network',
      'runtime',
      'serviceAccountEmail',
      'sourceArchiveUrl',
      'sourceRepository',
      'sourceUploadUrl',
      'status',
      'timeout',
      'updateTime',
      'versionId'
    ].join(',')
    const name = 'projects/my-project/locations/us-east1/functions/my-function'
    const params = { name, availableMemoryMb: 512 }
    await patchFunction(provider, name, params)

    expect(mockRequest).toHaveBeenCalledWith(
      'cloudfunctions',
      'v1',
      'projects',
      'locations',
      'functions',
      'patch',
      {
        name,
        updateMask,
        resource: params
      }
    )
  })
})
