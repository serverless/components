import { merge } from '@serverless/utils'
import getRootInputs from '../components/getRootInputs'

const readStateFile = async (projectPath, serverlessFileObject) => {
  const rootInputs = await getRootInputs(projectPath, serverlessFileObject)
  const config = merge({ state: {}, projectPath }, rootInputs)
  const type = config.state.type || 'local'
  switch (type) {
    case 'aws-s3':
      return awsS3.read(config)
    case 'aws-dynamodb':
      return awsDynamoDB.read(config)
    default:
      return local.read(config)
  }
}

export default readStateFile
