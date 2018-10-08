import fs from 'fs-extra'
import os from 'os'
import path from 'path'

const getDownloadedTypesCachePath = async () => {
  const componentsCachePath = path.join(os.homedir(), '.serverless', 'components', 'cache')
  await fs.ensureDir(componentsCachePath)
  return componentsCachePath
}

export default getDownloadedTypesCachePath
