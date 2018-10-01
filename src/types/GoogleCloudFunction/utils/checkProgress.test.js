const checkProgress = require('./checkProgress')

jest.mock('./getOperation', () =>
  jest
    .fn()
    .mockImplementationOnce(() => ({
      done: false
    }))
    .mockImplementationOnce(() => ({ done: false }))
    .mockImplementationOnce(() => ({ done: true }))
)
jest.mock('./delay', () => jest.fn().mockResolvedValue())

const provider = {
  request: jest.fn().mockResolvedValue()
}

afterAll(() => {
  jest.restoreAllMocks()
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('#checkProgress()', () => {
  it('should monitor the operation until the "done" flag is set to "true"', async () => {
    const name = 'operations/s0m31dh45h'

    const res = await checkProgress(provider, name)

    expect(res).toEqual({ done: true })
  })
})
