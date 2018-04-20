const path = require('path')
const { fse, readFileIfExists } = require('./fs')
const archiver = require('archiver')

module.exports = async (inputDirPath, outputFilePath, format) => {
  const ignore = await readFileIfExists(path.join(inputDirPath, '.slsignore')) || []
  return new Promise((resolve, reject) => {
    const output = fse.createWriteStream(outputFilePath)
    const archive = archiver(format, {
      zlib: { level: 9 }
    })

    output.on('open', () => {
      archive.pipe(output)
      archive.glob('**/*', {
        cwd: inputDirPath,
        ignore
      }, {})
      archive.finalize()
    })

    archive.on('error', (err) => reject(err))
    output.on('close', async () => resolve(outputFilePath))
  })
}
