const getAuthClient = require('./getAuthClient')
const { google } = require('googleapis')

jest.mock('bluebird', () => ({
  promisifyAll: () => ({
    readFileAsync: jest.fn(() =>
      Promise.resolve('{ "client_email": "client-email", "private_key": "private-key" }')
    )
  })
}))

describe('#getAuthClient()', () => {
  it('should return a new auth client', async () => {
    const res = await getAuthClient('key-file')

    expect(res).toBeInstanceOf(google.auth.JWT)
  })
})
