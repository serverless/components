const uuid = require('uuid')
const writeFileAtomic = require('write-file-atomic')

const getServerlessrcPath = require('./getServerlessrcPath')
const readFile = require('../fs/readFile')

module.exports = async () => {
  // set default config options
  const config = {
    userId: null, // currentUserId
    frameworkId: uuid.v1(),
    trackingDisabled: false,
    meta: {
      created_at: Math.round(+new Date() / 1000),
      updated_at: null
    }
  }

  // save new config
  writeFileAtomic.sync(getServerlessrcPath(), JSON.stringify(config, null, 2))
  return JSON.parse(await readFile(getServerlessrcPath()))
}
