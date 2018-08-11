const getRootInputs = require('../../components/getRootInputs')
const { merge } = require('ramda')

const local = require('./local')
const awsS3 = require('./aws-s3')
const awsDynamoDB = require('./aws-dynamodb')

module.exports = async (projectPath, serverlessFileObject) => {
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
