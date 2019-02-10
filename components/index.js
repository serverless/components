const Component = require('./Component/serverless')
const Components = require('./Components/serverless')
const Role = require('./Role/serverless')
const Lambda = require('./Lambda/serverless')
const Website = require('./Website/serverless')
const DynamoDB = require('./DynamoDB/serverless')
const WebSockets = require('./WebSockets/serverless')
const Socket = require('./Socket/serverless')
const RealtimeApp = require('./RealtimeApp/serverless')
const ChatApp = require('./ChatApp/serverless')

module.exports = {
  Component,
  Components,
  Role,
  Lambda,
  Website,
  DynamoDB,
  WebSockets,
  Socket,
  RealtimeApp,
  ChatApp
}
