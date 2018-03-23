const getTmpDir = require('./getTmpDir')
const dirExists = require('./dirExists')

describe('#getTmpDir()', () => {
  it('should create and return a namespaced tmp directory path', async () => {
    const tmpDirPath = await getTmpDir()

    expect(tmpDirPath).toMatch(/.+tmpdirs-serverless-components.+/)
    expect(await dirExists(tmpDirPath)).toEqual(true)
  })
})
