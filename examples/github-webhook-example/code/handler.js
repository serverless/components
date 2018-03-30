
module.exports.githubFunction = (event, context, callback) => {
  console.log('Function ran!')
  return callback(null, {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json'
    },
    body: 'created'
  })
}
