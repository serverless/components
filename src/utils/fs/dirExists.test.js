const dirExists = require('./dirExists')
const getTmpDir = require('./getTmpDir')

describe('#dirExists()', () => {
  let tmpDirPath

  beforeEach(async () => {
    tmpDirPath = await getTmpDir()
  })

  it('should return true if the directory exists', async () => {
    const res = await dirExists(tmpDirPath)
    expect(res).toEqual(true)
  })

  it('should return false if the directory does not exist', async () => {
    tmpDirPath = 'some/invalid/path'
    const res = await dirExists(tmpDirPath)
    expect(res).toEqual(false)
  })
})
