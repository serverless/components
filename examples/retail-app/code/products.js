const products = [
  { id: '0', name: 'Phlebotinum', price: 3.99 },
  { id: '1', name: 'Unobtainium', price: 9.99 },
  { id: '2', name: 'Skub', price: 2.49 }
]

function create(evt, ctx, cb) {
  cb(null, {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json'
    },
    body: 'created'
  })
}

function get(evt, ctx, cb) {
  const id = parseInt(evt.pathParameters.id || 0, 10)
  if (!products[id]) {
    cb(null, {
      statusCode: 404,
      body: 'Product not found.'
    })
    return
  }

  cb(null, {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(products[id])
  })
}

function list(evt, ctx, cb) {
  cb(null, {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(products)
  })
}

module.exports = { create, get, list }
