module.exports.task = async (event, context) => {
  console.log('this is running in a schedule...')
  return { result: 'successful' }
}
