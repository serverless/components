import os from 'os'
import path from 'path'

const getDownloadedTypesCachePath = () =>
  path.join(os.homedir(), '.serverless', 'components', 'cache')

export default getDownloadedTypesCachePath
