module.exports.handler = (cloudEvent, context) => {
  // eslint-disable-next-line
  console.log('cloudEvent:', cloudEvent)
  // eslint-disable-next-line
  console.log('context:', context)
  return {
    hello: 'world!'
  }
}
