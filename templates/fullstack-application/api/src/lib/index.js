const AWS = require('aws-sdk')
// Config dynamodb
AWS.config.update({ region: process.env.dbRegion })
const db = new AWS.DynamoDB.DocumentClient()

/**
 * Get Votes
 */

const getVotes = async () => {
  var params = {
    TableName: process.env.dbName,
    Key: {
      pk: 'votes'
    }
  }

  let votes = await db.get(params).promise()

  if (votes && votes.Item) votes = { votes: votes.Item.votes || 0 }

  console.log(votes)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: votes
  }
}

/**
 * Save Vote
 */

const saveVote = async (event = {}) => {
  let params = {
    TableName: process.env.dbName,
    ReturnValue: 'ALL_NEW',
    ExpressionAttributeValues: { ':sk': 1, ':zero': 1 },
    ExpressionAttributeNames: { '#sk': 'votes' },
    UpdateExpression: 'SET #sk = if_not_exists(#sk, :zero) + :sk',
    Key: { pk: 'votes' }
  }

  let votes = await db.update(params).promise()
  return await getVotes()
}

module.exports = {
  saveVote,
  getVotes
}
