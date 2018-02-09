const AWS = require('aws-sdk')

const dynamodb = new AWS.DynamoDB()
module.exports.handler = (e, ctx, cb) => {
  if (e.headers['X-GitHub-Event'] === 'ping') {
    cb(null, { statusCode: 200, body: 'Hello Github!' })
  }
  const body = JSON.parse(e.body || {})
  if (body.action) {
    const params = {
      Item: {
        'repo': {
          S: 'eslam-components'
        },
        'action': {
          S: body.action
        }
      },
      ReturnConsumedCapacity: 'TOTAL',
      TableName: 'github-webhook-receiver'
    }

    return dynamodb.putItem(params).promise().then(res => {
      cb(null, { statusCode: 200, body: 'YAY! github event saved to database!' })
    }).catch(e => {
      console.log(e)
      cb(null, { statusCode: 500, body: 'FUDGE! something went wrong while saving github event!' })
    })
  } else {
    cb(null, { statusCode: 200, body: 'Someone invoked me!' })
  }
}
