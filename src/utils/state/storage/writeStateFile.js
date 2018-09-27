const getRootInputs = require('../../components/getRootInputs')
const { merge } = require('ramda')

const local = require('./local')
const awsS3 = require('./aws-s3')
const awsDynamoDB = require('./aws-dynamodb')
const { encryptState } = require('../encryptState')

module.exports = async (projectPath, content, serverlessFileObject) => {
  const rootInputs = await getRootInputs(projectPath, serverlessFileObject)
  const config = merge({ state: {}, projectPath }, rootInputs)
  const type = config.state.type || 'local'
  const encryptedContent = encryptState(content)
  switch (type) {
    case 'aws-s3':
      return awsS3.write(config, encryptedContent)
    case 'aws-dynamodb':
      return awsDynamoDB.write(config, encryptedContent)
    default:
      return local.write(config, encryptedContent)
  }
}
