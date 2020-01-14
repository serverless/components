/*
 * Internal Utils - Only exported for internal use
 */

const { contains, isNil, last, split } = require('ramda')
const path = require('path')
const globby = require('globby')
const AdmZip = require('adm-zip')
const axios = require('axios')
const fs = require('fs')

const sleep = async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait))

const pack = async (inputDirPath, outputFilePath, include = [], exclude = []) => {
  const format = last(split('.', outputFilePath))

  if (!contains(format, ['zip', 'tar'])) {
    throw new Error('Please provide a valid format. Either a "zip" or a "tar"')
  }

  const patterns = ['**']

  if (!isNil(exclude)) {
    exclude.forEach((excludedItem) => patterns.push(`!${excludedItem}`))
  }

  const zip = new AdmZip()

  const files = (await globby(patterns, { cwd: inputDirPath })).sort()

  if (files.length === 0) {
    throw new Error(`The provided directory is empty and cannot be packaged`)
  }

  files.map((file) => {
    if (file === path.basename(file)) {
      zip.addLocalFile(path.join(inputDirPath, file))
    } else {
      zip.addLocalFile(path.join(inputDirPath, file), path.dirname(file))
    }
  })

  if (!isNil(include)) {
    include.forEach((file) => zip.addLocalFile(path.join(inputDirPath, file)))
  }

  zip.writeZip(outputFilePath)

  return outputFilePath
}

module.exports = {
  sleep,
  pack
}
