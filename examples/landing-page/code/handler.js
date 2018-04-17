
module.exports.landingPageFunction = (event, context, callback) => {
  console.log('Function ran!') // eslint-disable-line
  return callback(null, {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      status: '⊂◉‿◉つ'
    })
  })
}
