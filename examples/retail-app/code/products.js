/* eslint-disable no-console */

const AWS = require('aws-sdk')

const dynamo = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const tableName = process.env.productTableName

function create(evt, ctx, cb) {
  // item = { id: 5, name: 'Phlebotinum', description: 'desc1', price: 3.99 }
  const item = JSON.parse(evt.body)
  dynamo.put(
    {
      Item: item,
      TableName: tableName
    },
    (err, resp) => {
      if (err) {
        cb(err)
      } else {
        cb(null, {
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(resp)
        })
      }
    }
  )
}

function get(evt, ctx, cb) {
  const vId = parseInt(evt.pathParameters.id, 10)
  dynamo.get(
    {
      Key: {
        id: vId
      },
      TableName: tableName
    },
    (err, data) => {
      if (err) {
        cb(err)
      } else {
        const product = data.Item
        cb(null, {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(product)
        })
      }
    }
  )
}

function list(evt, ctx, cb) {
  dynamo.scan(
    {
      TableName: tableName
    },
    (err, data) => {
      if (err) {
        cb(err)
      } else {
        const products = data.Items
        cb(null, {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(products)
        })
      }
    }
  )
}

module.exports = { create, get, list }
