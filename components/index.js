const Component = require('./Component/serverless')
const Role = require('./Role/serverless')
const Lambda = require('./Lambda/serverless')
const Website = require('./Website/serverless')
const DynamoDB = require('./DynamoDB/serverless')
const WebSockets = require('./WebSockets/serverless')
const Socket = require('./Socket/serverless')
const RealtimeApp = require('./RealtimeApp/serverless')

module.exports = {
  Component,
  Role,
  Lambda,
  Website,
  DynamoDB,
  WebSockets,
  Socket,
  RealtimeApp
}
