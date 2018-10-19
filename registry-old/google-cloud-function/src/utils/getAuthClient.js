const fs = require('fs')
const BbPromise = require('bluebird')
const { google } = require('googleapis')
const getCredentialsPath = require('./getCredentialsPath')

const fsp = BbPromise.promisifyAll(fs)

async function getAuthClient(keyFilePath) {
  const credentialsPath = getCredentialsPath(keyFilePath)
  const keyFileContent = (await fsp.readFileAsync(credentialsPath)).toString()
  const key = JSON.parse(keyFileContent)

  return new google.auth.JWT(key.client_email, null, key.private_key, [
    'https://www.googleapis.com/auth/cloud-platform'
  ])
}

module.exports = getAuthClient
