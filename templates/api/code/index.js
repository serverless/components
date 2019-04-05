module.exports.handler = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless! Your function executed successfully!'
    })
  }

  callback(null, response)
}
