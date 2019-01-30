const Component = require('./Component/serverless')
const Parent = require('./Parent/serverless')
const Child = require('./Child/serverless')
const Role = require('./Role/serverless')
const Lambda = require('./Lambda/serverless')
const Website = require('./Website/serverless')
const DynamoDB = require('./DynamoDB/serverless')
const WebSockets = require('./WebSockets/serverless')
const Socket = require('./Socket/serverless')

module.exports = {
  Component,
  Parent,
  Child,
  Role,
  Lambda,
  Website,
  DynamoDB,
  WebSockets,
  Socket
}
