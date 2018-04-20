const path = require('path')
const semverRegex = require('semver-regex')

const { fileExists, readFile } = require('../fs')
const pack = require('../pack')

module.exports = async (options) => {
  const validFormats = [ 'zip', 'tar' ]
  const format = options.format || 'zip'
  const slsYmlFilePath = path.join(process.cwd(), 'serverless.yml')
  if (!await fileExists(slsYmlFilePath)) {
    throw new Error('The package command can only be run inside a component directory')
  }

  const slsYml = await readFile(slsYmlFilePath)

  if (!semverRegex().test(slsYml.version)) {
    throw new Error('Please provide a valid version for your component')
  }

  if (!options.path) {
    throw new Error('Please provide an output path for the package with the --path option')
  }

  if (!validFormats.includes(format)) {
    throw new Error('Please provide a valid format. Either a "zip" or a "tar"')
  }

  const outputFileName = `${slsYml.type}@${slsYml.version}.${format}`
  const outputFilePath = path.resolve(options.path, outputFileName)

  return pack(process.cwd(), outputFilePath, format)
    .then(() => console.log(`Component has been packaged in ${outputFilePath}`)) // eslint-disable-line
}
