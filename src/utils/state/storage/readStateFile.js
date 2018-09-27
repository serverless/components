const getRootInputs = require('../../components/getRootInputs')
const { merge } = require('ramda')

const local = require('./local')
const awsS3 = require('./aws-s3')
const awsDynamoDB = require('./aws-dynamodb')
const { decryptState } = require('../encryptState')

module.exports = async (projectPath, serverlessFileObject) => {
  const rootInputs = await getRootInputs(projectPath, serverlessFileObject)
  const config = merge({ state: {}, projectPath }, rootInputs)
  const type = config.state.type || 'local'
  let content
  switch (type) {
    case 'aws-s3':
      content = awsS3.read(config)
      break
    case 'aws-dynamodb':
      content = awsDynamoDB.read(config)
      break
    default:
      content = local.read(config)
  }
  return decryptState(content)
}
