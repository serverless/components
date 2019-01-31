const { join } = require('path')
const { fileExists } = require('@serverless/utils')
const parseYaml = require('./parseYaml')
const parseJson = require('./parseJson')

async function loadServerlessFile(path) {
  const serverlessJsonFile = join(path, 'serverless.json')
  const serverlessYmlFile = join(path, 'serverless.yml')
  const serverlessYamlFile = join(path, 'serverless.yaml')

  let fileContent
  if (await fileExists(serverlessYmlFile)) {
    fileContent = await parseYaml(serverlessYmlFile)
  } else if (await fileExists(serverlessYamlFile)) {
    fileContent = await parseYaml(serverlessYamlFile)
  } else if (await fileExists(serverlessJsonFile)) {
    fileContent = await parseJson(serverlessJsonFile)
  } else {
    throw new Error(
      `No Serverless config file (serverless.yml, serverless.yaml or serverless.json) found in ${path}`
    )
  }

  return fileContent
}

module.exports = loadServerlessFile
