const path = require('path')
const crypto = require('crypto')
const fs = require('fs-extra')
const os = require('os')
const archiver = require('archiver')

try {
  module.exports = async (packagePath, tempPath) => {
    // Set defaults
    tempPath = tempPath || os.tmpdir()

    /*
    * Ensure id includes datetime and unique string,
    * since packaging can happen in parallel
    */

    let outputFileName = crypto.randomBytes(3).toString('hex')
    outputFileName = `${String(Date.now())}-${outputFileName}.zip`
    const outputFilePath = path.join(tempPath, outputFileName)

    // return the full path for the archived file
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputFilePath)
      const archive = archiver('zip', {
        zlib: { level: 9 }
      })

      output.on('open', () => {
        archive.pipe(output)
        archive.directory(packagePath, false)
        archive.finalize()
      })
      archive.on('error', (err) => reject(err))
      output.on('close', () => {
        try {
          const zipContents = fs.readFileSync(outputFilePath)
          const outputFileHash = crypto.createHash('sha256').update(zipContents).digest('base64')
          resolve([outputFileName, outputFilePath, outputFileHash])
        } catch (e) {
          console.log('zip contents error', e)
        }
      })
    })
  }
} catch (e) {
  console.log('Error in zipping source code.')
}
