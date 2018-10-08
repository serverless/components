import utils from '@serverless/utils'
import errorReporter from './errorReporter'

describe('#errorReporter()', () => {
  jest.mock('@serverless/utils')

  afterAll(() => {
    jest.restoreAllMocks()
  })
  it('should return a Sentry Raven object if config file can be found', async () => {
    utils.fileExists.mockImplementation(() => Promise.resolve(true))
    utils.readFile.mockImplementation(() =>
      Promise.resolve({
        sentryDSN: 'https://wasd:1234@sentry.io/4711',
        environment: 'test'
      })
    )

    const res = await errorReporter()
    expect(res).not.toBeFalsy()
  })

  it('should return null if config file can not be found', async () => {
    utils.fileExists.mockImplementation(() => Promise.resolve(false))

    const res = await errorReporter()
    expect(res).toBeFalsy()
  })
})
