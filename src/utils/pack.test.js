const path = require('path')
const os = require('os')
const crypto = require('crypto')
const fse = require('fs-extra')
const admZip = require('adm-zip')
const pack = require('./pack')

describe('#pack()', () => {
  let outputDirPath
  let inputDirPath

  beforeEach(async () => {
    inputDirPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex'))
    outputDirPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex'))
    await fse.ensureDir(inputDirPath)
    await fse.ensureDir(outputDirPath)
    await fse.writeJson(path.join(inputDirPath, 'foo.json'), {
      key1: 'value1',
      key2: 'value2'
    })
  })

  it('should package a directory and return the file path', async () => {
    const outputFilePath = path.join(outputDirPath, `${crypto.randomBytes(6).toString('hex')}.zip`)
    const returnedOutputFilePath = await pack(inputDirPath, outputFilePath)
    const zipRes = await fse.readFile(outputFilePath)
    const zip = admZip(zipRes)
    const files = zip.getEntries().map((entry) => ({
      name: entry.entryName,
      content: entry.getData()
    }))
    const jsonFile = files.filter((file) => file.name === 'foo.json').pop()

    expect(files.length).toEqual(1)
    expect(JSON.parse(jsonFile.content.toString('utf8'))).toEqual({
      key1: 'value1',
      key2: 'value2'
    })
    expect(returnedOutputFilePath).toEqual(outputFilePath)
  })
})
