import log from './log'

jest.spyOn(global.console, 'log')

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
    log(undefined, msg)
    expect(global.console.log).toHaveBeenCalledWith(msg)
  })

  it('should not write message to stdout if CI env var is set', () => {
    process.env.CI = true
    log(undefined, msg)
    expect(global.console.log).not.toHaveBeenCalled()
  })
})
