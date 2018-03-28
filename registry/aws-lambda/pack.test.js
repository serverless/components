const path = require('path')
const os = require('os')
const crypto = require('crypto')
const fse = require('fs-extra')
const BbPromise = require('bluebird')
const admZip = require('adm-zip')
const pack = require('./pack')

const fsp = BbPromise.promisifyAll(fse)

describe('#pack()', () => {
  let tmpDirPath
  let oldCwd

  beforeEach(async () => {
    tmpDirPath = path.join(
      os.tmpdir(),
      'tmpdirs-serverless-components',
      'aws-lambda',
      crypto.randomBytes(8).toString('hex')
    )
    await fsp.ensureDirAsync(tmpDirPath)
    oldCwd = process.cwd()
    process.chdir(tmpDirPath)
  })

  afterEach(() => {
    process.chdir(oldCwd)
  })

  it('should zip the cwd and return the zip file content', async () => {
    const jsonFileSourcePath = path.join(tmpDirPath, 'foo.json')
    fsp.writeJsonAsync(jsonFileSourcePath, {
      key1: 'value1',
      key2: 'value2'
    })

    const zipRes = await pack(tmpDirPath)

    const zip = admZip(zipRes)
    const files = zip.getEntries().map((entry) => ({
      name: entry.entryName,
      content: entry.getData()
    }))

    const zipFile = files.filter((file) => file.name.match(/.+.zip/)).pop()
    const jsonFile = files.filter((file) => file.name === 'foo.json').pop()

    expect(files.length).toEqual(2)
    expect(zipFile).not.toBeFalsy()
    expect(JSON.parse(jsonFile.content.toString('utf8'))).toEqual({
      key1: 'value1',
      key2: 'value2'
    })
  })
})
