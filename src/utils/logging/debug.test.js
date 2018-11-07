import debug from './debug'

jest.spyOn(global.console, 'log')

afterAll(() => {
  jest.resetAllMocks()
  delete process.env.CI
})

describe('#debug()', () => {
  const msg = 'Hello World!'

  beforeEach(() => {
    jest.resetAllMocks()
    delete process.env.CI
  })

  it('should log message using console.log (node 6 and <= 8.9 support)', () => {
    debug({ options: { debug: true } }, msg)
    expect(global.console.log).toHaveBeenCalledWith(msg)
  })

  it('should not write message to log if CI env var is set', () => {
    process.env.CI = true
    debug({ options: { debug: true } }, msg)
    expect(global.console.log).not.toHaveBeenCalled()
  })

  it('should not write message to log if options.dubug is undefined', () => {
    debug({ options: {} }, msg)
    expect(global.console.log).not.toHaveBeenCalled()
  })
})
