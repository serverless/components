const createFunction = require('./createFunction')

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

describe('#createFunction()', () => {
  it('should perform a request to create the function', async () => {
    const location = 'projects/my-project/locations/us-east1'
    const name = 'projects/my-project/locations/us-east1/functions/my-function'
    const params = { name }
    await createFunction(provider, location, params)

    expect(mockRequest).toHaveBeenCalledWith(
      'cloudfunctions',
      'v1',
      'projects',
      'locations',
      'functions',
      'create',
      {
        location,
        resource: params
      }
    )
  })
})
