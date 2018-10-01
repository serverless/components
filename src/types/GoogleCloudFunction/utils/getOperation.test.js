const getOperation = require('./getOperation')

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

describe('#getOperation()', () => {
  it('should perform a request to get the operation', async () => {
    const name = 'operations/s0m31dh45h'
    await getOperation(provider, name)

    expect(mockRequest).toHaveBeenCalledWith('cloudfunctions', 'v1', 'operations', 'get', { name })
  })
})
