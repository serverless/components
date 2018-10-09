import { toInteger } from '@serverless/utils'

const parseDeploymentNumber = (deploymentId) =>
  toInteger(deploymentId.replace(/^[a-zA-Z0-9-_]*-/, ''))

export default parseDeploymentNumber
