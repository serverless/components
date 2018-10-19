const path = require('path')
const os = require('os')
const crypto = require('crypto')
const fse = require('fs-extra')
const BbPromise = require('bluebird')
const decompress = require('decompress')
const pack = require('./pack')

const fsp = BbPromise.promisifyAll(fse)

describe('#pack()', () => {
  let tempPath
  let packagePath

  beforeEach(async () => {
    packagePath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex'))
    tempPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex'))
    await fsp.ensureDirAsync(packagePath)
    await fsp.ensureDirAsync(tempPath)
    await fsp.writeJsonAsync(path.join(packagePath, 'foo.json'), {
      key1: 'value1',
      key2: 'value2'
    })
  })

  it('should zip the directory path and return the zip with its metadata', async () => {
    const { fileName, filePath, hash } = await pack(packagePath, tempPath)

    expect(fileName).toMatch(/.+\-.+\.zip/)
    expect(filePath).toContain(tempPath)
    expect(hash).toBeDefined()

    // check the file content
    const unzipRes = await decompress(filePath)
    const files = unzipRes.map((entry) => ({
      name: entry.path.split(path.sep).pop(),
      content: entry.data
    }))
    const jsonFile = files.filter((file) => file.name === 'foo.json').pop()
    expect(files.length).toEqual(1)
    expect(JSON.parse(jsonFile.content.toString('utf8'))).toEqual({
      key1: 'value1',
      key2: 'value2'
    })
  })
})
