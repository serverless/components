const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const archiver = require('archiver')
const BbPromise = require('bluebird')

const fsp = BbPromise.promisifyAll(fs)

module.exports = async (root) => {
  const outputDir = os.tmpdir()

  /*
  * Ensure id includes datetime and unique string,
  * since packaging can happen in parallel
  */
  let outputFileName = crypto.randomBytes(3).toString('hex')
  outputFileName = `${String(Date.now())}-${outputFileName}.zip`
  const outputFilePath = path.join(outputDir, outputFileName)

  // Detect function package root or default to cwd
  root = root || process.cwd()

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    output.on('open', () => {
      archive.pipe(output)
      // archive.glob(root + '/**/*');
      archive.directory(root, false)
      archive.finalize()
    })

    archive.on('error', (err) => reject(err))
    output.on('close', async () => resolve(await fsp.readFileAsync(outputFilePath)))
  })
}
