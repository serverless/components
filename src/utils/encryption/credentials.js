const path = require('path')
const crypto = require('crypto')
const fs = require('fs-extra')
const { readFile, fileExists, writeFile } = require('@serverless/utils')

const createCredentials = async (credentialsPath) => {
  await fs.ensureFile(credentialsPath)
  const key = crypto.randomBytes(16).toString('hex')
  const iv = crypto.randomBytes(8).toString('hex')
  const credentials = Buffer.from(`${key}:${iv}`).toString('base64')
  return writeFile(credentialsPath, credentials)
}

const setupCredentials = async (projectPath) => {
  const credentialsPath = path.join(projectPath, '.state-credentials')
  if (!process.env.COMPONENTS_ENC_KEY || !process.env.COMPONENTS_ENC_IV) {
    if (!(await fileExists(credentialsPath))) {
      await createCredentials(credentialsPath)
    }
    // @todo add credentials to gitignore
    const credentials = await readFile(credentialsPath)
    const [key, iv] = Buffer.from(credentials, 'base64')
      .toString()
      .split(':')
    process.env.COMPONENTS_ENC_KEY = key
    process.env.COMPONENTS_ENC_IV = iv
  }
}

module.exports = {
  setupCredentials
}
