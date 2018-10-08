import { assocPath } from '@serverless/utils'
import getAppId from './getAppId'

const setAppId = (stateFile) => assocPath(['$', 'appId'], getAppId(stateFile), stateFile)

export default setAppId
