const uuid = require('uuid')

const errorReporter = require('./track')
const getConfig = require('../config/getConfig')
const fetch = require('node-fetch')

jest.mock('../config/getConfig')
jest.mock('node-fetch')

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#tracking', () => {
  it('should not track if tracking is disabled', async () => {
    getConfig.mockImplementation(() => {
      const config = {
        userId: null, // currentUserId
        frameworkId: uuid.v1(),
        trackingDisabled: false,
        meta: {
          created_at: Math.round(+new Date() / 1000),
          updated_at: null
        }
      }
      return Promise.resolve(config)
    })
    fetch.mockImplementation(() =>
      Promise.resolve({ sentryDSN: 'https://wasd:1234@sentry.io/4711', environment: 'test' }))

    const res = await errorReporter()
    expect(res).not.toBeFalsy()
  })

  it('should return null if config file can not be found', async () => {
    fs.fileExists.mockImplementation(() => Promise.resolve(false))

    const res = await errorReporter()
    expect(res).toBeFalsy()
  })
})
