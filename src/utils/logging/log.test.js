const log = require('./log')

const logSpy = jest.spyOn(process.stdout, 'write')

afterAll(() => {
  jest.resetAllMocks()
  delete process.env.CI
})

describe('#log()', () => {
  const msg = 'Hello World!'

  beforeEach(() => {
    jest.resetAllMocks()
    delete process.env.CI
  })

  it('should write message to stdout', () => {
    log(msg)
    expect(logSpy).toHaveBeenCalledWith(`${msg}\n`)
  })

  it('should not write message to stdout if CI env var is set', () => {
    process.env.CI = true
    log(msg)
    expect(logSpy).not.toHaveBeenCalled()
  })
})
