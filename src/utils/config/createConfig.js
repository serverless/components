import { readFile } from '@serverless/utils'
import uuid from 'uuid'
import writeFileAtomic from 'write-file-atomic'
import getServerlessrcPath from './getServerlessrcPath'

const createConfig = async () => {
  const config = {
    userId: null, // currentUserId
    frameworkId: uuid.v1(),
    trackingDisabled: false,
    meta: {
      created_at: Math.round(+new Date() / 1000),
      updated_at: null
    }
  }

  writeFileAtomic.sync(getServerlessrcPath(), JSON.stringify(config, null, 2))
  return JSON.parse(await readFile(getServerlessrcPath()))
}

export default createConfig
