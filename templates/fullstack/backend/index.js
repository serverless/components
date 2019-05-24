module.exports.createUser = async (e) => {
  return {
    statusCode: 200,
    body: 'Created User'
  }
}

module.exports.getUsers = async (e) => {
  return {
    statusCode: 200,
    body: 'Got Users'
  }
}
