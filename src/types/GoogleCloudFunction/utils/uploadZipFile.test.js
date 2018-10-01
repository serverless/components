const fetch = require('node-fetch')
const uploadZipFile = require('./uploadZipFile')

jest.mock('node-fetch', () => jest.fn().mockResolvedValue({ ok: true }))
jest.mock('fs', () => ({
  createReadStream: () => 'some-read-stream-data'
}))

afterAll(() => {
  jest.restoreAllMocks()
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('#uploadZipFile()', () => {
  it('should upload the .zip file to the given URL', async () => {
    const url = 'https://example.com/uploads'
    const filePath = '/some/file/path/file.zip'

    const res = await uploadZipFile(url, filePath)

    expect(fetch).toHaveBeenCalledWith('https://example.com/uploads', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/zip',
        'x-goog-content-length-range': '0,104857600'
      },
      body: 'some-read-stream-data'
    })
    expect(res).toEqual({ ok: true })
  })
})
