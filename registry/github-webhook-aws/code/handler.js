
module.exports.githubFunction = (evt, ctx, cb) => {
  cb(null, {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json'
    },
    body: 'created'
  })
}
