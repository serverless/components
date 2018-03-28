const path = require('path')
const archiver = require('archiver')
const BbPromise = require('bluebird')
const fs = require('fs')

const fsp = BbPromise.promisifyAll(fs)

module.exports = async (outputDir) => {
  const outputFileName = `${String(Date.now())}.zip`
  const outputFilePath = path.join(outputDir, outputFileName)
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    output.on('open', () => {
      archive.pipe(output)
      archive.glob(
        '**/*',
        {
          cwd: process.cwd()
        },
        {}
      )
      archive.finalize()
    })

    archive.on('error', (err) => reject(err))
    output.on('close', async () => resolve(await fsp.readFileAsync(outputFilePath)))
  })
}
