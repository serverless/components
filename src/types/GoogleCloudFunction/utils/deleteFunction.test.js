const deleteFunction = require('./deleteFunction')

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

describe('#deleteFunction()', () => {
  it('should perform a request to delete the function', async () => {
    const name = 'projects/my-project/locations/us-east1/functions/my-function'
    await deleteFunction(provider, name)

    expect(mockRequest).toHaveBeenCalledWith(
      'cloudfunctions',
      'v1',
      'projects',
      'locations',
      'functions',
      'delete',
      { name }
    )
  })
})
