const getConfig = require('../../misc/getConfig')

const local = require('./local')
const awsS3 = require('./aws-s3')
const awsDynamoDB = require('./aws-dynamodb')

module.exports = async (projectPath, content) => {
  const config = await getConfig(projectPath)
  const type = config.state && config.state.type ? config.state.type : 'local'
  switch (type) {
    case 'aws-s3':
      return awsS3.write(config, content)
    case 'aws-dynamodb':
      return awsDynamoDB.write(config, content)
    default:
      return local.write(config, content)
  }
}
