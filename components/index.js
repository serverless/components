const AwsDynamoDb = require('./AwsDynamoDb/serverless')
const AwsIamRole = require('./AwsIamRole/serverless')
const AwsLambda = require('./AwsLambda/serverless')
const Website = require('./Website/serverless')
const WebSockets = require('./WebSockets/serverless')
const Socket = require('./Socket/serverless')
const RealtimeApp = require('./RealtimeApp/serverless')
const ChatApp = require('./ChatApp/serverless')

module.exports = {
  AwsDynamoDb,
  AwsIamRole,
  AwsLambda,
  Website,
  WebSockets,
  Socket,
  RealtimeApp,
  ChatApp,
}
