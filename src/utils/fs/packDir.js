const { contains, isEmpty, last, split } = require('ramda')
const { createReadStream, createWriteStream } = require('fs-extra')
const archiver = require('archiver')
const globby = require('globby')
const path = require('path')

const VALID_FORMATS = ['zip', 'tar']
const isValidFormat = (format) => contains(format, VALID_FORMATS)

const packDir = async (inputDirPath, outputFilePath, include = [], prefix) => {
  const format = last(split('.', outputFilePath))
  console.log(outputFilePath)

  if (!isValidFormat(format)) {
    throw new Error('Please provide a valid format. Either a "zip" or a "tar"')
  }

  const files = (await globby(['**'], { cwd: inputDirPath }))
    .sort() // we must sort to ensure correct hash
    .map((file) => ({
      input: path.join(inputDirPath, file),
      output: prefix ? path.join(prefix, file) : file
    }))

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputFilePath)
    const archive = archiver(format, {
      zlib: { level: 9 }
    })

    output.on('open', () => {
      archive.pipe(output)

      // we must set the date to ensure correct hash
      files.forEach((file) =>
        archive.append(createReadStream(file.input), { name: file.output, date: new Date(0) })
      )

      if (!isEmpty(include)) {
        include.forEach((file) => {
          const stream = createReadStream(file)
          archive.append(stream, { name: path.basename(file) })
        })
      }

      archive.finalize()
    })

    archive.on('error', (err) => reject(err))
    output.on('close', () => resolve(outputFilePath))
  })
}

module.exports = packDir
