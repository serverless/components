const path = require('path')
const os = require('os')
const crypto = require('crypto')
const fse = require('fs-extra')
const BbPromise = require('bluebird')
const admZip = require('adm-zip')
const pack = require('./pack')

const fsp = BbPromise.promisifyAll(fse)

describe('#pack()', () => {
  let tempPath
  const packagePath = __dirname

  beforeEach(async () => {
    tempPath = path.join(
      os.tmpdir(),
      'tmpdirs-serverless-components',
      'aws-lambda',
      crypto.randomBytes(3).toString('hex')
    )
    await fsp.ensureDirAsync(tempPath)
  })

  afterEach(() => {
  })

  it('should zip the aws-lambda component and return the zip file content', async () => {
    fsp.writeJsonAsync(path.join(tempPath, 'foo.json'), {
      key1: 'value1',
      key2: 'value2'
    })

    const zipRes = await pack(packagePath, tempPath)
    const zip = admZip(zipRes)
    const files = zip.getEntries().map((entry) => ({
      name: entry.entryName,
      content: entry.getData()
    }))
    const zipFile = files.filter((file) => file.name.match(/.+.zip/)).pop()

    expect(files.length)
    expect(zipFile).not.toBeFalsy()
  })
})
