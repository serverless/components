import path from 'path'
import os from 'os'
import fse from 'fs-extra'

const getDownloadedTypesCachePath = async () => {
  const componentsCachePath = path.join(os.homedir(), '.serverless', 'components', 'cache')
  await fse.ensureDirAsync(componentsCachePath)
  return componentsCachePath
}

export default getDownloadedTypesCachePath
