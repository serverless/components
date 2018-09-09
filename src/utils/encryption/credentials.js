const path = require('path')
const crypto = require('crypto')
const fs = require('fs-extra')
const { readFile, fileExists, writeFile } = require('@serverless/utils')
const { EOL } = require('os')

const { log } = require('../../utils/logging')

const createCredentials = async (credentialsPath) => {
  await fs.ensureFile(credentialsPath)
  const key = crypto.randomBytes(16).toString('hex')
  const iv = crypto.randomBytes(8).toString('hex')
  const credentials = Buffer.from(`${key}:${iv}`).toString('base64')
  return writeFile(credentialsPath, credentials)
}

const addCredentialsToGitignore = async (projectPath) => {
  const gitignorePath = path.join(projectPath, '.gitignore')
  if (await fileExists(gitignorePath)) {
    let gitignore = await readFile(gitignorePath)
    if (!/\.components\-credentials/g.test(gitignore)) {
      gitignore = `${gitignore}${EOL}# Serverless Components credentials file${EOL}.components-credentials${EOL}`
      log('Added .components-credentials to .gitignore')
      await writeFile(gitignorePath, gitignore)
    }
  }
  return Promise.resolve()
}

const setupCredentials = async ({ projectPath }) => {
  const credentialsPath = path.join(projectPath, '.components-credentials')
  if (!process.env.COMPONENTS_ENC_KEY || !process.env.COMPONENTS_ENC_IV) {
    if (!(await fileExists(credentialsPath))) {
      await createCredentials(credentialsPath)
      await addCredentialsToGitignore(projectPath)
    }
    const credentials = await readFile(credentialsPath)
    const [key, iv] = Buffer.from(credentials, 'base64')
      .toString()
      .split(':')
    process.env.COMPONENTS_ENC_KEY = key
    process.env.COMPONENTS_ENC_IV = iv
  }
}

module.exports = setupCredentials
