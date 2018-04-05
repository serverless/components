const AWS = require('aws-sdk') // eslint-disable-line
const EventGatewaySDK = require('@serverless/event-gateway-sdk')
const multipart = require('parse-multipart')

const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

module.exports.handler = (event, context, callback) => {
  const eventGateway = new EventGatewaySDK({
    url: 'http://myeventgateway.io',
    space: 'prod'
  })
  const boundary = multipart.getBoundary(event.data.headers['Content-Type'][0])
  const body = new Buffer(event.data.body, 'base64') // eslint-disable-line
  const parts = multipart.Parse(body, boundary)

  const key = parts[0].filename
  const params = {
    Body: parts[0].data,
    Bucket: process.env.BUCKET,
    Key: key,
    ContentType: parts[0].type
  }

  s3
    .putObject(params)
    .promise()
    .then(() => {
      eventGateway.emit({
        event: 'fileUploaded',
        data: {
          fileUrl: `https://s3.amazonaws.com/${process.env.BUCKET}/${key}`,
          fileName: key
        }
      })

      const response = {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Success!'
        })
      }

      return callback(null, response)
    })
    .catch(() => {
      return callback('Something went wrong')
    })
}
