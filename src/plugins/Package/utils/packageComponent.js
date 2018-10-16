import { fileExists, isEmpty, isNil, packDir, readFile } from '@serverless/utils'
import path from 'path'
import semver from 'semver'

module.exports = async (options, context) => {
  const format = options.format || 'zip'
  let componentPath = options.path || options.projectPath
  const { serverlessFileObject } = options

  if (!path.isAbsolute(componentPath)) {
    componentPath = path.resolve(process.cwd(), componentPath)
  }

  let slsYml
  if (!isNil(serverlessFileObject) && !isEmpty(serverlessFileObject)) {
    slsYml = serverlessFileObject
  } else {
    const slsYmlFilePath = path.join(componentPath, 'serverless.yml')
    if (!(await fileExists(slsYmlFilePath))) {
      throw new Error(`Could not find a serverless.yml file in ${componentPath}`)
    }
    slsYml = await readFile(slsYmlFilePath)
  }

  if (semver.valid(slsYml.version) === null) {
    throw new Error('Please provide a valid version for your component')
  }

  const outputFileName = `${slsYml.type}@${slsYml.version}.${format}`
  const outputFilePath = path.resolve(componentPath, outputFileName)

  await packDir(componentPath, outputFilePath)

  context.log(`Component has been packaged in ${outputFilePath}`)

  return outputFilePath
}
