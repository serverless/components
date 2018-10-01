const path = require('path')
const os = require('os')
const crypto = require('crypto')
const fse = require('fs-extra')
const decompress = require('decompress')
const pack = require('./pack')

describe('#pack()', () => {
  let code
  let packageDirPath
  let tempDirPath
  let indexJsFilePath

  beforeEach(async () => {
    packageDirPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex'))
    tempDirPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex'))
    indexJsFilePath = path.join(packageDirPath, 'index.js')
    await fse.ensureDir(packageDirPath)
    await fse.ensureDir(tempDirPath)
    await fse.writeFile(indexJsFilePath, 'exports.key1 = "value1"')
  })

  it('should zip the directory and return its metadata if no shim is used', async () => {
    code = packageDirPath
    const { fileName, filePath, hash } = await pack(code, tempDirPath)

    expect(fileName).toMatch(/.+\-.+\.zip/)
    expect(filePath).toContain(tempDirPath)
    expect(hash).toBeDefined()

    // check the file content
    const unzipRes = await decompress(filePath)
    const files = unzipRes.map((entry) => ({
      name: entry.path.split(path.sep).pop(),
      content: entry.data
    }))
    const indexJsFile = files.filter((file) => file.name === 'index.js').pop()
    expect(files.length).toEqual(1)

    expect(indexJsFile.content.toString('utf8')).toEqual('exports.key1 = "value1"')
  })

  it('should zip the directory and return its metadata if a shim is used', async () => {
    // create the shim file in a temp directory
    const shimDirPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex'))
    await fse.ensureDir(shimDirPath)
    const shimJsFilePath = path.join(shimDirPath, 'shim.js')
    await fse.writeFile(shimJsFilePath, 'exports.key2 = "value2"')

    code = [packageDirPath, shimJsFilePath]
    const { fileName, filePath, hash } = await pack(code, tempDirPath)

    expect(fileName).toMatch(/.+\-.+\.zip/)
    expect(filePath).toContain(tempDirPath)
    expect(hash).toBeDefined()

    // check the file content
    const unzipRes = await decompress(filePath)
    const files = unzipRes.map((entry) => ({
      name: entry.path.split(path.sep).pop(),
      content: entry.data
    }))
    const indexJsFile = files.filter((file) => file.name === 'index.js').pop()
    expect(files.length).toEqual(1)

    expect(indexJsFile.content.toString('utf8')).toEqual(
      'exports.key1 = "value1"\n\nexports.key2 = "value2"'
    )
  })
})
