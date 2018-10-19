const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const os = require('os')
const BbPromise = require('bluebird')
const archiver = require('archiver')

const fsp = BbPromise.promisifyAll(fs)

async function pack(packagePath, tempPath) {
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
    output.on('close', async () => {
      try {
        const zipContents = await fsp.readFileAsync(outputFilePath)
        const outputFileHash = crypto
          .createHash('sha256')
          .update(zipContents)
          .digest('base64')
        resolve({
          fileName: outputFileName,
          filePath: outputFilePath,
          hash: outputFileHash
        })
      } catch (e) {
        reject(e)
      }
    })
  })
}

module.exports = pack
