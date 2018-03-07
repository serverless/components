const AWS = require('aws-sdk') // eslint-disable-line
const fdk = require('@serverless/fdk')
const multipart = require('parse-multipart')

const eventGateway = fdk.eventGateway({
  url: 'https://eslam.eventgateway-dev.io/anything'
})
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

module.exports.handler = (event, context, callback) => {
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

      callback(null, response)
    })
    .catch(() => {
      callback('Something went wrong')
    })
}
