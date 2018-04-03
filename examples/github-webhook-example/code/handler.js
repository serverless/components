
module.exports.githubFunction = (event, context, callback) => {
  console.log('Function ran!') // eslint-disable-line
  return callback(null, {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: '⊂◉‿◉つ'
    })
  })
}
