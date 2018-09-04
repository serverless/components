const path = require('path')
const os = require('os')
const crypto = require('crypto')
const fse = require('fs-extra')
const BbPromise = require('bluebird')
const getStorageClient = require('./getStorageClient')
const googleStorage = require('@google-cloud/storage')

const fsp = BbPromise.promisifyAll(fse)

describe('#getStorageClient()', () => {
  let keyFilePath

  beforeEach(async () => {
    const keyFileDir = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex'))
    keyFilePath = path.join(keyFileDir, 'gcloud.json')
    await fsp.ensureDirAsync(keyFileDir)
    await fsp.writeJsonAsync(keyFilePath, {
      client_email: 'client-email',
      private_key: 'private-key'
    })
  })

  it('should return a new storage client', () => {
    const projectId = 'project-id'
    const res = getStorageClient(keyFilePath, projectId)

    expect(res).toBeInstanceOf(googleStorage)
  })
})
