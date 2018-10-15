import { fileExists } from '@serverless/utils'
import rc from 'rc'
import createConfig from './createConfig'
import getServerlessrcPath from './getServerlessrcPath'

// NOTE BRN: This method belongs here and not in @serverless/utils because it has to be able to deal with projects from different versions of the framework. Therefore it must be backward compatible and cannot be used independently of the framework version.

const getConfig = async () => {
  if (!(await fileExists(getServerlessrcPath()))) {
    createConfig()
  }
  return rc('serverless')
}

export default getConfig
