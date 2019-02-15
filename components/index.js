const Component = require('./Component/serverless')
const Components = require('./Components/serverless')
const AwsDynamoDB = require('./AwsDynamoDB/serverless')
const AwsIamRole = require('./AwsIamRole/serverless')
const AwsLambda = require('./AwsLambda/serverless')
const Website = require('./Website/serverless')
const WebSockets = require('./WebSockets/serverless')
const Socket = require('./Socket/serverless')
const RealtimeApp = require('./RealtimeApp/serverless')
const ChatApp = require('./ChatApp/serverless')

module.exports = {
  Component,
  Components,
  AwsDynamoDB,
  AwsIamRole,
  AwsLambda,
  Website,
  WebSockets,
  Socket,
  RealtimeApp,
  ChatApp,
}
