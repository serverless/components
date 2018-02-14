const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const fdk = require('@serverless/fdk');
const multipart = require('parse-multipart');

const eventGateway = fdk.eventGateway({
  url: `https://${process.env.EVENT_GATEWAY_SUBDOMAIN}.eventgateway-dev.io`
});
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports.run = (event, context, callback) => {
  console.log('Event: ', event);
  const boundary = multipart.getBoundary(event.data.headers['Content-Type'][0]);
  const body = new Buffer(event.data.body, 'base64');
  const parts = multipart.Parse(body, boundary);

  const key = parts[0].filename;
  const params = {
    Body: parts[0].data,
    Bucket: process.env.BUCKET,
    Key: key,
    ContentType: parts[0].type
  };
  s3
    .putObject(params)
    .promise()
    .then(() => {
      eventGateway.emit({
        event: 'FileUploaded',
        data: {
          fileUrl: `https://s3.amazonaws.com/${process.env.BUCKET}/${key}`,
          fileName: key
        }
      });

      const response = {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Success!'
        })
      };

      callback(null, response);
    })
    .catch(err => {
      console.log(err);
      callback('Something went wrong');
    });
};
