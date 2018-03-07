const AWS = require('aws-sdk')

const dynamodb = new AWS.DynamoDB()
module.exports.handler = (e, ctx, cb) => { // eslint-disable-line
  if (e.headers['X-GitHub-Event'] === 'ping') {
    cb(null, { statusCode: 200, body: 'Hello Github!' })
  }
  const body = JSON.parse(e.body || {})
  if (body.action) {
    const params = {
      Item: {
        repo: {
          S: 'eslam-components'
        },
        action: {
          S: body.action
        }
      },
      ReturnConsumedCapacity: 'TOTAL',
      TableName: 'github-webhook-receiver'
    }

    return dynamodb.putItem(params).promise().then(() => {
      cb(null, { statusCode: 200, body: 'YAY! github event saved to database!' })
    }).catch(() => {
      cb(null, { statusCode: 500, body: 'FUDGE! something went wrong while saving github event!' })
    })
  } else { // eslint-disable-line
    cb(null, { statusCode: 200, body: 'Someone invoked me!' })
  }
}
