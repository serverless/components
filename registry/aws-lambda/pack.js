const path = require('path')
const archiver = require('archiver')
const os = require('os')
const fs = require('fs')

module.exports = async () => {
  const outputFileName = `${String(Date.now())}.zip`
  const outputFilePath = path.join(os.tmpdir(), outputFileName)
  return new Promise((resolve, reject) => { // eslint-disable-line

    const output = fs.createWriteStream(outputFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    archive.on('error', (err) => reject(err))
    output.on('close', () => resolve(fs.readFileSync(outputFilePath)))

    archive.pipe(output)

    archive.glob('**/*', {
      cwd: process.cwd()
    }, {})
    archive.finalize()
  })
}
