const getConfig = require('../../misc/getConfig')

const local = require('./local')
const awsS3 = require('./aws-s3')
const awsDynamo = require('./aws-dynamo')

module.exports = async (projectPath) => {
  const config = await getConfig(projectPath)
  const type = config.state && config.state.type ? config.state.type : 'local'
  switch (type) {
    case 'aws-s3':
      return awsS3.read(config)
    case 'aws-dynamodb':
      return awsDynamo.read(config)
    default:
      return local.read(config)
  }
}
