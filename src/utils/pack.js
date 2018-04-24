const path = require('path')
const { fse, readFileIfExists } = require('./fs')
const archiver = require('archiver')

module.exports = async (inputDirPath, outputFilePath) => {
  const validFormats = [ 'zip', 'tar' ]
  const format = outputFilePath.split('.')[outputFilePath.split('.').length - 1]

  if (!validFormats.includes(format)) {
    throw new Error('Please provide a valid format. Either a "zip" or a "tar"')
  }

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
