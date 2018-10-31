module.exports.hello = (cloudEvent, context) => {
  // eslint-disable-next-line
  console.log('cloudEvents:', cloudEvent)
  // eslint-disable-next-line
  console.log('context:', context)
  return { foo: 'bar' }
}
