const fs = require('fs')
const fse = require('fs-extra')
const { join } = require('path')
const crypto = require('crypto')
const os = require('os')
const archiver = require('archiver')
const { readFile, writeFile } = require('@serverless/utils')

async function pack(code, tempPath) {
  tempPath = tempPath || os.tmpdir()

  const tmpStatgingDir = join(tempPath, 'staging')
  const tmpResultDir = join(tempPath, 'result')
  await fse.ensureDir(tmpStatgingDir)
  await fse.ensureDir(tmpResultDir)

  // check whether we're using a shim (see: GoogleCloudFunctionCompute)
  if (Array.isArray(code)) {
    const packagePath = code[0]
    const shimFilePath = code[1]
    // copy all the files over to the staging directory
    await fse.copy(packagePath, tmpStatgingDir)
    // TODO: assuming a Node.js runtime and an index.js file here...
    const indexFilePath = join(tmpStatgingDir, 'index.js')
    const indexFileContent = await readFile(indexFilePath)
    const shimFileContent = await readFile(shimFilePath)
    // append the shim file content to the index file content
    const updatedIndexFileContent = `${indexFileContent}\n\n${shimFileContent}`
    // overwrite the index file in the staging directory with the updated version
    const updatedIndexFilePath = join(tmpStatgingDir, 'index.js')
    await writeFile(updatedIndexFilePath, updatedIndexFileContent)
  } else {
    // copy all the files over to the stagind directory
    await fse.copy(code, tmpStatgingDir)
  }

  let outputFileName = crypto.randomBytes(3).toString('hex')
  outputFileName = `${String(Date.now())}-${outputFileName}.zip`
  const outputFilePath = join(tmpResultDir, outputFileName)

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    output.on('open', () => {
      archive.pipe(output)
      archive.directory(tmpStatgingDir, false)
      archive.finalize()
    })
    archive.on('error', (err) => reject(err))
    output.on('close', async () => {
      try {
        const zipContents = await readFile(outputFilePath)
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
