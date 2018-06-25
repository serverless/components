const AWS = require('aws-sdk') // eslint-disable-line
const uuidv4 = require('uuid/v4')

const dbClient = new AWS.DynamoDB.DocumentClient()

const putFileEntry = (fileUrl, fileName) =>
  new Promise((resolve, reject) => {
    const item = {
      repo: 'abc',
      id: uuidv4(),
      fileUrl,
      fileName
    }
    const params = {
      TableName: process.env.FILES_TABLE,
      Item: item
    }

    dbClient.put(params, (err) => {
      if (err) reject(err)
      else resolve(item)
    })
  })

module.exports.handler = (event, context, callback) => {
  putFileEntry(event.data.fileUrl, event.data.fileName)
    .then(() => {
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
