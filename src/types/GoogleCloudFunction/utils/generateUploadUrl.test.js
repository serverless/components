const generateUploadUrl = require('./generateUploadUrl')

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

describe('#generateUploadUrl()', () => {
  it('should perform a request to generate an upload URL', async () => {
    const location = 'projects/my-project/locations/us-east1'
    await generateUploadUrl(provider, location)

    expect(mockRequest).toHaveBeenCalledWith(
      'cloudfunctions',
      'v1',
      'projects',
      'locations',
      'functions',
      'generateUploadUrl',
      {
        parent: location
      }
    )
  })
})
