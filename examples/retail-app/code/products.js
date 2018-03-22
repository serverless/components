/* eslint-disable no-console */
const dynasty = require('dynasty')({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

function create(evt, ctx, cb) {
  const productsTable = dynasty.table('products')
  const data = JSON.parse(evt.body)
  productsTable.insert(data)
    .then((resp) => {
      cb(null, {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: resp
      })
    })
}

function get(evt, ctx, cb) {
  const productsTable = dynasty.table('products')
  const id = parseInt(evt.pathParameters.id || 0, 10)
  productsTable.find(id)
    .then((product) => {
      cb(null, {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(product)
      })
    })
    .catch((err) => {
      cb(null, {
        statusCode: 404,
        body: { message: `Product with '${id}' not found. Error: ${err}` }
      })
    })
}

function list(evt, ctx, cb) {
  const productsTable = dynasty.table('products')
  productsTable.scan()
    .then((products) => {
      cb(null, {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(products)
      })
    })
}

module.exports = { create, get, list }
